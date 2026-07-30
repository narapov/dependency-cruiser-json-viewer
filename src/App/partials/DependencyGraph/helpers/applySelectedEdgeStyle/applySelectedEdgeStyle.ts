import type { Edge } from '@xyflow/react';

import { SELECTED_EDGE_COLOR } from '@/Shared';

import { withEdgeStrokeStyle } from '../withEdgeStrokeStyle';

const SELECTED_EDGE_Z_INDEX = 1000;

export function applySelectedEdgeStyle(edges: Edge[], selectedEdgeId: string | null): Edge[] {
  if (selectedEdgeId == null) return edges;

  return edges.map(edge => {
    if (edge.id !== selectedEdgeId) return edge;

    return withEdgeStrokeStyle(edge, {
      color: SELECTED_EDGE_COLOR,
      strokeWidth: 3,
      zIndex: SELECTED_EDGE_Z_INDEX,
    });
  });
}
