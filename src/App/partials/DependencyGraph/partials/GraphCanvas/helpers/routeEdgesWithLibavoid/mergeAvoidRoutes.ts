import type { Edge } from '@xyflow/react';

import type { AvoidRoute, DependencyEdgeData } from '../../types';
import { avoidRouteToPath } from '../avoidRouteToPath';
import { collectCrossingJumps } from './collectCrossingJumps';

/** Returns edges with numeric avoid routes, jumps, and precomputed SVG paths (п7). */
export function mergeAvoidRoutes(edges: readonly Edge[], avoidRoutes: ReadonlyMap<string, AvoidRoute>): Edge[] {
  if (avoidRoutes.size === 0) {
    return [...edges];
  }

  const crossingJumpsByEdge = collectCrossingJumps(avoidRoutes);

  return edges.map(edge => {
    const avoidRoute = avoidRoutes.get(edge.id);
    if (!avoidRoute) {
      return edge;
    }

    const data = edge.data as DependencyEdgeData | undefined;
    const crossingJumps = crossingJumpsByEdge.get(edge.id);
    const avoidPath = avoidRouteToPath(avoidRoute);
    const avoidPathWithJumps =
      crossingJumps && crossingJumps.length > 0 ? avoidRouteToPath(avoidRoute, crossingJumps) : avoidPath;

    return {
      ...edge,
      data: {
        ...data,
        title: data?.title ?? edge.id,
        avoidRoute,
        avoidPath,
        avoidPathWithJumps,
        ...(crossingJumps && crossingJumps.length > 0 ? { crossingJumps } : {}),
      },
    };
  });
}
