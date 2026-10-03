import type { RoutableEdge, ThinRoutingEdge } from '../../types';

/** Project App routable edges to thin libavoid worker edges (ports only). */
export function toThinRoutingEdges(edges: readonly RoutableEdge[]): ThinRoutingEdge[] {
  return edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    ...(edge.sourcePort ? { sourcePort: edge.sourcePort } : {}),
    ...(edge.targetPort ? { targetPort: edge.targetPort } : {}),
  }));
}
