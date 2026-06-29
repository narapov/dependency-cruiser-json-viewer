import { describe, expect, it } from 'vitest';

import { MarkerType, type Edge } from '@xyflow/react';

import { CIRCULAR_EDGE_COLOR } from '../../../../Shared';
import { applyUserEdgeHighlightStyle } from './applyUserEdgeHighlightStyle';

const USER_HIGHLIGHT_EDGE_Z_INDEX = 1001;
const USER_COLOR = '#e6194b';
const DEP_KEY = 'src/a.ts->src/b.ts';

function edgeAt(id: string, overrides: Partial<Edge> = {}): Edge {
  return {
    id,
    source: 'a',
    target: 'b',
    markerEnd: { type: MarkerType.ArrowClosed, color: CIRCULAR_EDGE_COLOR },
    style: { stroke: CIRCULAR_EDGE_COLOR, strokeWidth: 2, strokeDasharray: '6 4' },
    ...overrides,
  };
}

describe('applyUserEdgeHighlightStyle', () => {
  const edges = [edgeAt('edge-1'), edgeAt('edge-2')];
  const edgeDependencyKeyMap = new Map<string, string[]>([
    ['edge-1', [DEP_KEY]],
    ['edge-2', ['src/c.ts->src/d.ts']],
  ]);

  it('returns edges unchanged when no highlights are set', () => {
    expect(applyUserEdgeHighlightStyle(edges, new Map(), edgeDependencyKeyMap)).toBe(edges);
  });

  it('applies user color, z-index, and markerEnd via dependency keys', () => {
    const highlights = new Map([[DEP_KEY, USER_COLOR]]);
    const result = applyUserEdgeHighlightStyle(edges, highlights, edgeDependencyKeyMap);
    const highlighted = result.find(edge => edge.id === 'edge-1');

    expect(highlighted?.zIndex).toBe(USER_HIGHLIGHT_EDGE_Z_INDEX);
    expect(highlighted?.style?.stroke).toBe(USER_COLOR);
    expect(highlighted?.style?.strokeWidth).toBe(3);
    expect(highlighted?.markerEnd).toMatchObject({ color: USER_COLOR });
  });

  it('preserves strokeDasharray for type-only edges', () => {
    const highlights = new Map([[DEP_KEY, USER_COLOR]]);
    const result = applyUserEdgeHighlightStyle(edges, highlights, edgeDependencyKeyMap);
    const highlighted = result.find(edge => edge.id === 'edge-1');

    expect(highlighted?.style?.strokeDasharray).toBe('6 4');
  });

  it('does not modify unhighlighted edges', () => {
    const highlights = new Map([[DEP_KEY, USER_COLOR]]);
    const result = applyUserEdgeHighlightStyle(edges, highlights, edgeDependencyKeyMap);
    const unhighlighted = result.find(edge => edge.id === 'edge-2');

    expect(unhighlighted).toEqual(edges[1]);
  });
});
