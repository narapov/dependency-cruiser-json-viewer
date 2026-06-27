import { MarkerType, type Edge } from '@xyflow/react'
import { describe, expect, it } from 'vitest'
import { SELECTED_EDGE_COLOR, SELECTED_EDGE_Z_INDEX } from '../buildGraph'
import { applySelectedEdgeStyle } from './applySelectedEdgeStyle'

function edgeAt(id: string): Edge {
  return {
    id,
    source: 'a',
    target: 'b',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#b1b1b7' },
    style: { stroke: '#b1b1b7', strokeWidth: 1 },
  }
}

describe('applySelectedEdgeStyle', () => {
  const edges = [edgeAt('edge-1'), edgeAt('edge-2')]

  it('returns edges unchanged when nothing is selected', () => {
    expect(applySelectedEdgeStyle(edges, null)).toBe(edges)
  })

  it('applies orange stroke and z-index to the selected edge', () => {
    const result = applySelectedEdgeStyle(edges, 'edge-1')
    const selected = result.find((edge) => edge.id === 'edge-1')

    expect(selected?.zIndex).toBe(SELECTED_EDGE_Z_INDEX)
    expect(selected?.style?.stroke).toBe(SELECTED_EDGE_COLOR)
    expect(selected?.style?.strokeWidth).toBe(3)
    expect(selected?.markerEnd).toMatchObject({ color: SELECTED_EDGE_COLOR })
  })

  it('does not modify unselected edges', () => {
    const result = applySelectedEdgeStyle(edges, 'edge-1')
    const unselected = result.find((edge) => edge.id === 'edge-2')

    expect(unselected).toEqual(edges[1])
  })
})
