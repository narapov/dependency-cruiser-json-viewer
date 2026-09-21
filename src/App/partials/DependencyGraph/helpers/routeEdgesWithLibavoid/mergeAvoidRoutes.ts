import type { Edge } from '@xyflow/react';

import type { AvoidRoute, DependencyEdgeData } from '../../types';

/** Returns edges with `data.avoidRoute` merged from the overlay map (does not mutate input). */
export function mergeAvoidRoutes(edges: readonly Edge[], avoidRoutes: ReadonlyMap<string, AvoidRoute>): Edge[] {
  if (avoidRoutes.size === 0) {
    return [...edges];
  }

  return edges.map(edge => {
    const avoidRoute = avoidRoutes.get(edge.id);
    if (!avoidRoute) {
      return edge;
    }

    const data = edge.data as DependencyEdgeData | undefined;
    return {
      ...edge,
      data: {
        ...data,
        title: data?.title ?? edge.id,
        avoidRoute,
      },
    };
  });
}
