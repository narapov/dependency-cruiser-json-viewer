import type { Edge, Node } from '@xyflow/react';

import type { AvoidRoute, EdgePort } from '../../../types';
import type { LibavoidRoutingProgress } from './LibavoidRoutingProgress';

/** Serializable node geometry for the libavoid worker. */
export interface RouteEdgesWorkerNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  width?: number | null;
  height?: number | null;
  parentId?: string | null;
}

/** Serializable edge endpoints for the libavoid worker. */
export interface RouteEdgesWorkerEdge {
  id: string;
  source: string;
  target: string;
  sourcePort?: EdgePort;
  targetPort?: EdgePort;
}

export interface RouteEdgesWorkerRequest {
  nodes: RouteEdgesWorkerNode[];
  edges: RouteEdgesWorkerEdge[];
  parentByNode: Array<[string, string | null]>;
}

export type RouteEdgesWorkerResponse =
  | { ok: true; type: 'progress'; progress: LibavoidRoutingProgress }
  | { ok: true; type: 'result'; routes: Array<[string, AvoidRoute]> }
  | { ok: false; message: string };

/** Builds a structured-clone-friendly request from React Flow graph state. */
export function toRouteEdgesWorkerRequest(input: {
  nodes: readonly Node[];
  edges: readonly Edge[];
  parentByNode: ReadonlyMap<string, string | null>;
}): RouteEdgesWorkerRequest {
  const { nodes, edges, parentByNode } = input;

  return {
    nodes: nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: { ...node.position },
      width: node.width,
      height: node.height,
      parentId: node.parentId ?? null,
    })),
    edges: edges.map(edge => {
      const data = edge.data as { sourcePort?: EdgePort; targetPort?: EdgePort } | undefined;
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        ...(data?.sourcePort ? { sourcePort: data.sourcePort } : {}),
        ...(data?.targetPort ? { targetPort: data.targetPort } : {}),
      };
    }),
    parentByNode: [...parentByNode.entries()],
  };
}

/** Reconstructs RF-like nodes/edges for `routeEdgesWithLibavoid` inside the worker. */
export function fromRouteEdgesWorkerRequest(request: RouteEdgesWorkerRequest): {
  nodes: Node[];
  edges: Edge[];
  parentByNode: Map<string, string | null>;
} {
  return {
    nodes: request.nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: {},
      width: node.width ?? undefined,
      height: node.height ?? undefined,
      parentId: node.parentId ?? undefined,
    })),
    edges: request.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      data: {
        ...(edge.sourcePort ? { sourcePort: edge.sourcePort } : {}),
        ...(edge.targetPort ? { targetPort: edge.targetPort } : {}),
      },
    })),
    parentByNode: new Map(request.parentByNode),
  };
}
