import { MarkerType, type Edge } from '@xyflow/react';

interface WithEdgeStrokeStyleOptions {
  color: string;
  strokeWidth: number;
  zIndex?: number;
}

export function withEdgeStrokeStyle(edge: Edge, { color, strokeWidth, zIndex }: WithEdgeStrokeStyleOptions): Edge {
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
    ...(zIndex != null ? { zIndex } : {}),
    markerEnd,
    style: {
      ...edge.style,
      stroke: color,
      strokeWidth,
    },
  };
}
