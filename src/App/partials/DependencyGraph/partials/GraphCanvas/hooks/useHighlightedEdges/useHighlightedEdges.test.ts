// @vitest-environment jsdom
import { useState } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { act, renderHook } from '@testing-library/react';
import type { Edge } from '@xyflow/react';

import { makeDependencyKey } from '@/domain';

import { useSelectedDependencyEdgeStore } from '../../stores/selectedDependencyEdgeStore';
import { useHighlightedEdges } from './useHighlightedEdges';

const depKey = makeDependencyKey('a.ts', 'b.ts');

const baseEdges: Edge[] = [
  {
    id: 'a.ts->b.ts',
    source: 'a.ts',
    target: 'b.ts',
    data: {
      aggregated: [{ id: depKey, source: 'a.ts', target: 'b.ts' }],
    },
  },
];

function useHighlightedEdgesHarness(overrides: Partial<Parameters<typeof useHighlightedEdges>[0]> = {}) {
  const [userEdgeHighlights, setUserEdgeHighlights] = useState<ReadonlyMap<string, string>>(() => new Map());

  return useHighlightedEdges({
    baseEdges,
    userEdgeHighlights,
    onUserEdgeHighlightsChange: setUserEdgeHighlights,
    ...overrides,
  });
}

function renderHighlighted(overrides: Partial<Parameters<typeof useHighlightedEdges>[0]> = {}) {
  return renderHook(() => useHighlightedEdgesHarness(overrides));
}

describe('useHighlightedEdges', () => {
  beforeEach(() => {
    useSelectedDependencyEdgeStore.getState().setSelectedEdgeId(null);
  });

  it('selects an edge on click and clears selection', () => {
    const { result } = renderHighlighted();

    act(() => {
      result.current.onEdgeClick({} as never, baseEdges[0]!);
    });

    expect(useSelectedDependencyEdgeStore.getState().selectedEdgeId).toBe('a.ts->b.ts');

    act(() => {
      result.current.clearSelectedEdge();
    });

    expect(useSelectedDependencyEdgeStore.getState().selectedEdgeId).toBeNull();
  });

  it('selects an edge by id via selectEdge', () => {
    const { result } = renderHighlighted();

    act(() => {
      result.current.selectEdge('a.ts->b.ts');
    });

    expect(useSelectedDependencyEdgeStore.getState().selectedEdgeId).toBe('a.ts->b.ts');
  });

  it('sets and clears user edge highlights via aggregated keys', () => {
    const { result } = renderHighlighted();

    act(() => {
      result.current.setUserEdgeHighlight(baseEdges[0]!, '#ff0000');
    });

    expect(result.current.getEdgeHighlight(baseEdges[0]!)).toBe('#ff0000');

    act(() => {
      result.current.setUserEdgeHighlight(baseEdges[0]!, null);
    });

    expect(result.current.getEdgeHighlight(baseEdges[0]!)).toBeUndefined();
  });

  it('returns undefined highlight for edges without aggregated keys', () => {
    const { result } = renderHighlighted({
      baseEdges: [{ id: 'missing', source: 'x', target: 'y' }],
    });

    expect(result.current.getEdgeHighlight({ id: 'missing', source: 'x', target: 'y' })).toBeUndefined();
  });
});
