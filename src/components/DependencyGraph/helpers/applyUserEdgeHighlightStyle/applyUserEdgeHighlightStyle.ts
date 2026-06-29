import { MarkerType, type Edge } from '@xyflow/react';

const USER_HIGHLIGHT_EDGE_Z_INDEX = 1001;

export function applyUserEdgeHighlightStyle(
  edges: Edge[],
  userEdgeHighlights: ReadonlyMap<string, string>,
  edgeDependencyKeyMap: ReadonlyMap<string, readonly string[]>,
): Edge[] {
  if (userEdgeHighlights.size === 0) return edges;

  return edges.map(edge => {
    const dependencyKeys = edgeDependencyKeyMap.get(edge.id) ?? [];
    const color = dependencyKeys
      .map(key => userEdgeHighlights.get(key))
      .find((value): value is string => value != null);

    if (color == null) return edge;

    const markerEnd =
      typeof edge.markerEnd === 'object' && edge.markerEnd !== null
        ? {
            ...edge.markerEnd,
            type: MarkerType.ArrowClosed,
            color,
          }
        : {
            type: MarkerType.ArrowClosed,
            color,
          };

    return {
      ...edge,
      zIndex: USER_HIGHLIGHT_EDGE_Z_INDEX,
      markerEnd,
      style: {
        ...edge.style,
        stroke: color,
        strokeWidth: 3,
      },
    };
  });
}
