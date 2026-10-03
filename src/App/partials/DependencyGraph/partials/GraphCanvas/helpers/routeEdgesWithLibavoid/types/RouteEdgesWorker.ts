import type { AvoidRoute, ThinRoutingEdge, ThinRoutingNode, VisibleTreeLayoutedNode } from '../../../types';
import type { LibavoidRoutingProgress } from './LibavoidRoutingProgress';

/** Live geometry overlay applied when projecting the layouted tree for the worker. */
export interface RoutingNodeGeometry {
  position: { x: number; y: number };
  width: number;
  height: number;
}

export interface RouteEdgesWorkerRequest {
  tree: ThinRoutingNode[];
  edges: ThinRoutingEdge[];
}

export type RouteEdgesWorkerResponse =
  | { ok: true; type: 'progress'; progress: LibavoidRoutingProgress }
  | { ok: true; type: 'result'; routes: Array<[string, AvoidRoute]> }
  | { ok: false; message: string };

/** Project a layouted node to a thin worker DTO, applying optional live geometry. */
function toThinRoutingNode(
  node: VisibleTreeLayoutedNode,
  geometryByPath?: ReadonlyMap<string, RoutingNodeGeometry>,
): ThinRoutingNode {
  const geometry = geometryByPath?.get(node.path);

  return {
    path: node.path,
    ancestors: [...node.ancestors],
    descendants: [...node.descendants],
    position: geometry ? { x: geometry.position.x, y: geometry.position.y } : { ...node.position },
    width: geometry?.width ?? node.width,
    height: geometry?.height ?? node.height,
    ...(node.children ? { children: node.children.map(child => toThinRoutingNode(child, geometryByPath)) } : {}),
  };
}

/**
 * Builds a structured-clone-friendly worker request from the layouted tree + thin edges.
 * Narrows to {@link ThinRoutingNode} and applies live geometry in a single walk.
 */
export function toRouteEdgesWorkerRequest(input: {
  tree: readonly VisibleTreeLayoutedNode[];
  edges: readonly ThinRoutingEdge[];
  geometryByPath?: ReadonlyMap<string, RoutingNodeGeometry>;
}): RouteEdgesWorkerRequest {
  return {
    tree: input.tree.map(node => toThinRoutingNode(node, input.geometryByPath)),
    edges: input.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      ...(edge.sourcePort ? { sourcePort: { ...edge.sourcePort } } : {}),
      ...(edge.targetPort ? { targetPort: { ...edge.targetPort } } : {}),
    })),
  };
}
