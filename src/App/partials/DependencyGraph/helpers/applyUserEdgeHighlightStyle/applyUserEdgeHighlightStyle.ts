import type { Edge } from '@xyflow/react';

import { withEdgeStrokeStyle } from '../withEdgeStrokeStyle';

const USER_HIGHLIGHT_EDGE_Z_INDEX = 1001;

/** Applies user-chosen highlight colors to edges that match dependency keys. */
export function applyUserEdgeHighlightStyle(
  edges: Edge[],
  userEdgeHighlights: ReadonlyMap<string, string>,
  edgeDependencyKeyMap: ReadonlyMap<string, readonly string[]>,
): Edge[] {
  if (userEdgeHighlights.size === 0) {
    return edges;
  }

  return edges.map(edge => {
    const dependencyKeys = edgeDependencyKeyMap.get(edge.id) ?? [];
    const color = dependencyKeys
      .map(key => userEdgeHighlights.get(key))
      .find((value): value is string => value != null);

    if (color == null) {
      return edge;
    }

    return withEdgeStrokeStyle(edge, {
      color,
      strokeWidth: 3,
      zIndex: USER_HIGHLIGHT_EDGE_Z_INDEX,
    });
  });
}
