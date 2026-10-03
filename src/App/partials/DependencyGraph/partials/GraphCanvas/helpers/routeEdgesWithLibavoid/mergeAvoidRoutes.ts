import type { AvoidRoute, RoutableEdge } from '../../types';
import { avoidRouteToPath } from '../avoidRouteToPath';
import { collectCrossingJumps } from './collectCrossingJumps';

/** Returns App edges with numeric avoid routes, jumps, and precomputed SVG paths. */
export function mergeAvoidRoutes(
  edges: readonly RoutableEdge[],
  avoidRoutes: ReadonlyMap<string, AvoidRoute>,
): RoutableEdge[] {
  if (avoidRoutes.size === 0) {
    return [...edges];
  }

  const crossingJumpsByEdge = collectCrossingJumps(avoidRoutes);

  return edges.map(edge => {
    const avoidRoute = avoidRoutes.get(edge.id);
    if (!avoidRoute) {
      return edge;
    }

    const crossingJumps = crossingJumpsByEdge.get(edge.id);
    const avoidPath = avoidRouteToPath(avoidRoute);
    const avoidPathWithJumps =
      crossingJumps && crossingJumps.length > 0 ? avoidRouteToPath(avoidRoute, crossingJumps) : avoidPath;

    return {
      ...edge,
      avoidRoute,
      avoidPath,
      avoidPathWithJumps,
      ...(crossingJumps && crossingJumps.length > 0 ? { crossingJumps } : {}),
    };
  });
}
