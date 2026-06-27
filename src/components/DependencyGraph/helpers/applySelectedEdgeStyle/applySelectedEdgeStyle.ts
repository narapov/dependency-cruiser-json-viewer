import { MarkerType, type Edge } from '@xyflow/react'
import { SELECTED_EDGE_COLOR } from '../../../../Shared'

const SELECTED_EDGE_Z_INDEX = 1000

export function applySelectedEdgeStyle(edges: Edge[], selectedEdgeId: string | null): Edge[] {
  if (selectedEdgeId == null) return edges

  return edges.map((edge) => {
    if (edge.id !== selectedEdgeId) return edge

    const markerEnd =
      typeof edge.markerEnd === 'object' && edge.markerEnd !== null
        ? {
            ...edge.markerEnd,
            type: MarkerType.ArrowClosed,
            color: SELECTED_EDGE_COLOR,
          }
        : {
            type: MarkerType.ArrowClosed,
            color: SELECTED_EDGE_COLOR,
          }

    return {
      ...edge,
      zIndex: SELECTED_EDGE_Z_INDEX,
      markerEnd,
      style: {
        ...edge.style,
        stroke: SELECTED_EDGE_COLOR,
        strokeWidth: 3,
      },
    }
  })
}
