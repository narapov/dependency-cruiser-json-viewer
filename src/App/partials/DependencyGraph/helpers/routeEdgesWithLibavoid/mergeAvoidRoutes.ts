import type { Edge } from '@xyflow/react';

import type { AvoidRoute, DependencyEdgeData } from '../../types';
import { collectCrossingJumps } from './collectCrossingJumps';

/** Returns edges with `data.avoidRoute` and crossing jumps merged from the overlay map. */
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

    return {
      ...edge,
      data: {
        ...data,
        title: data?.title ?? edge.id,
        avoidRoute,
        ...(crossingJumps && crossingJumps.length > 0 ? { crossingJumps } : {}),
      },
    };
  });
}
