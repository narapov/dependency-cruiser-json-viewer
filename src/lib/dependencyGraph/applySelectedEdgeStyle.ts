import { MarkerType, type Edge } from '@xyflow/react'
import { SELECTED_EDGE_COLOR, SELECTED_EDGE_Z_INDEX } from './buildGraph'

export function applySelectedEdgeStyle(edges: Edge[], selectedEdgeId: string | null): Edge[] {
  if (selectedEdgeId == null) return edges

  return edges.map((edge) => {
    if (edge.id !== selectedEdgeId) return edge

    return {
      ...edge,
      zIndex: SELECTED_EDGE_Z_INDEX,
      markerEnd: {
        ...edge.markerEnd,
        type: MarkerType.ArrowClosed,
        color: SELECTED_EDGE_COLOR,
      },
      style: {
        ...edge.style,
        stroke: SELECTED_EDGE_COLOR,
        strokeWidth: 3,
      },
    }
  })
}
