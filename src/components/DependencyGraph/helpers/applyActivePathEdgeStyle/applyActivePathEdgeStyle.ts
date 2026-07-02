import { MarkerType, type Edge } from '@xyflow/react';

import { CIRCULAR_EDGE_COLOR, INCOMING_EDGE_COLOR, OUTGOING_EDGE_COLOR, TYPE_ONLY_CIRCULAR_EDGE_COLOR } from '@/Shared';

function isCircularEdge(edge: Edge): boolean {
  const stroke = edge.style?.stroke;
  return stroke === CIRCULAR_EDGE_COLOR || stroke === TYPE_ONLY_CIRCULAR_EDGE_COLOR;
}

function withEdgeColor(edge: Edge, color: string): Edge {
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
    markerEnd,
    style: {
      ...edge.style,
      stroke: color,
      strokeWidth: 2,
    },
  };
}

export function applyActivePathEdgeStyle(edges: Edge[], activePath: string | null): Edge[] {
  if (activePath == null) return edges;

  return edges.map(edge => {
    if (isCircularEdge(edge)) return edge;

    if (edge.target === activePath) {
      return withEdgeColor(edge, INCOMING_EDGE_COLOR);
    }

    if (edge.source === activePath) {
      return withEdgeColor(edge, OUTGOING_EDGE_COLOR);
    }

    return edge;
  });
}
