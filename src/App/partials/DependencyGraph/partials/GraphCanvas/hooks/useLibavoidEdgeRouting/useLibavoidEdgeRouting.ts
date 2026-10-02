import { useEffect, useRef, useState } from 'react';

import type { Edge } from '@xyflow/react';

import type { GraphEdgesType } from '@/domain';

import { mergeAvoidRoutes, type LibavoidRoutingProgress } from '../../helpers';
import { runRouteEdgesInWorker, type RouteEdgesWorkerSession } from '../../helpers/routeEdgesWorker';
import type { AvoidRoute, DependencyEdgeData, ThinRoutingEdge, VisibleTreeLayoutedNode } from '../../types';

interface UseLibavoidEdgeRoutingInput {
  edgesType: GraphEdgesType;
  /** Layouted visible-tree roots from buildGraph (source of truth for routing hierarchy). */
  layoutedTree: readonly VisibleTreeLayoutedNode[];
  /** Live custom-positioned nodes — geometry overlay at the worker boundary. */
  positionedNodes: ReadonlyMap<string, VisibleTreeLayoutedNode>;
  edges: readonly Edge[];
  isDragging: boolean;
}

interface UseLibavoidEdgeRoutingResult {
  routedEdges: Edge[];
  routingProgress: LibavoidRoutingProgress | null;
}

/** Build thin routing edges from RF edges (ports from edge data). */
function toThinRoutingEdges(edges: readonly Edge[]): ThinRoutingEdge[] {
  return edges.map(edge => {
    const data = edge.data as DependencyEdgeData | undefined;
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      ...(data?.sourcePort ? { sourcePort: data.sourcePort } : {}),
      ...(data?.targetPort ? { targetPort: data.targetPort } : {}),
    };
  });
}

/** Geometry overlay from live positioned nodes onto the layouted tree at the worker boundary. */
function geometryByPathFromPositionedNodes(
  positionedNodes: ReadonlyMap<string, VisibleTreeLayoutedNode>,
): Map<string, { position: { x: number; y: number }; width: number; height: number }> {
  return new Map(
    [...positionedNodes.entries()].map(([path, node]) => [
      path,
      { position: { ...node.position }, width: node.width, height: node.height },
    ]),
  );
}

/**
 * Schedules libavoid routing in a worker when edgesType is libavoidOrthogonal.
 * Clears routes during drag / in-flight; applies routes when the generation is still current.
 */
export function useLibavoidEdgeRouting(config: UseLibavoidEdgeRoutingInput): UseLibavoidEdgeRoutingResult {
  const { edgesType, layoutedTree, positionedNodes, edges, isDragging } = config;

  const [avoidRoutes, setAvoidRoutes] = useState<Map<string, AvoidRoute>>(() => new Map());
  const [routingProgress, setRoutingProgress] = useState<LibavoidRoutingProgress | null>(null);
  const generationRef = useRef(0);
  const sessionRef = useRef<RouteEdgesWorkerSession | null>(null);

  const routingActive = edgesType === 'libavoidOrthogonal' && !isDragging;

  useEffect(() => {
    generationRef.current += 1;
    const generation = generationRef.current;
    sessionRef.current?.terminate();
    sessionRef.current = null;

    if (!routingActive) {
      // Drop presentation routes so DependencyEdge falls back to smooth-step.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset when mode/drag changes
      setAvoidRoutes(new Map());
      setRoutingProgress(null);
      return;
    }

    if (layoutedTree.length === 0 || edges.length === 0) {
      setAvoidRoutes(new Map());
      setRoutingProgress(null);
      return;
    }

    // Clear previous routes while a new worker job runs (in-flight → smooth-step).
    setAvoidRoutes(new Map());
    setRoutingProgress({ phase: 'primary', completed: 0, total: Math.max(edges.length, 1) });

    const thinEdges = toThinRoutingEdges(edges);

    const session = runRouteEdgesInWorker({
      tree: layoutedTree,
      edges: thinEdges,
      geometryByPath: geometryByPathFromPositionedNodes(positionedNodes),
      onProgress: progress => {
        if (generation !== generationRef.current) {
          return;
        }
        setRoutingProgress(progress);
      },
    });
    sessionRef.current = session;

    void session.promise
      .then(routes => {
        if (generation !== generationRef.current) {
          return;
        }
        setAvoidRoutes(routes);
        setRoutingProgress(null);
      })
      .catch(error => {
        console.error('Error routing edges with libavoid', error);
        if (generation === generationRef.current) {
          setRoutingProgress(null);
        }
      });

    return () => {
      generationRef.current += 1;
      session.terminate();
      if (sessionRef.current === session) {
        sessionRef.current = null;
      }
    };
  }, [routingActive, layoutedTree, positionedNodes, edges]);

  const routedEdges: Edge[] = routingActive && avoidRoutes.size > 0 ? mergeAvoidRoutes(edges, avoidRoutes) : [...edges];

  return {
    routedEdges,
    routingProgress: routingActive ? routingProgress : null,
  };
}
