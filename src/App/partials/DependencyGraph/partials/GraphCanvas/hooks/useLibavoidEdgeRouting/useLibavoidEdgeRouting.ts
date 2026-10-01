import { useEffect, useRef, useState } from 'react';

import type { Edge, Node } from '@xyflow/react';

import type { GraphEdgesType } from '@/domain';

import {
  mergeAvoidRoutes,
  runRouteEdgesInWorker,
  type LibavoidRoutingProgress,
  type RouteEdgesWorkerSession,
} from '../../helpers';
import type { AvoidRoute } from '../../types';

interface UseLibavoidEdgeRoutingInput {
  edgesType: GraphEdgesType;
  nodes: readonly Node[];
  edges: readonly Edge[];
  parentByNode: ReadonlyMap<string, string | null>;
  isDragging: boolean;
}

interface UseLibavoidEdgeRoutingResult {
  routedEdges: Edge[];
  routingProgress: LibavoidRoutingProgress | null;
}

/**
 * Schedules libavoid routing in a worker when edgesType is libavoidOrthogonal.
 * Clears routes during drag / in-flight; applies routes when the generation is still current.
 */
export function useLibavoidEdgeRouting(config: UseLibavoidEdgeRoutingInput): UseLibavoidEdgeRoutingResult {
  const { edgesType, nodes, edges, parentByNode, isDragging } = config;

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

    if (nodes.length === 0 || edges.length === 0) {
      setAvoidRoutes(new Map());
      setRoutingProgress(null);
      return;
    }

    // Clear previous routes while a new worker job runs (in-flight → smooth-step).
    setAvoidRoutes(new Map());
    setRoutingProgress({ phase: 'primary', completed: 0, total: Math.max(edges.length, 1) });

    const session = runRouteEdgesInWorker({
      nodes,
      edges,
      parentByNode,
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
  }, [routingActive, nodes, edges, parentByNode]);

  const routedEdges: Edge[] = routingActive && avoidRoutes.size > 0 ? mergeAvoidRoutes(edges, avoidRoutes) : [...edges];

  return {
    routedEdges,
    routingProgress: routingActive ? routingProgress : null,
  };
}
