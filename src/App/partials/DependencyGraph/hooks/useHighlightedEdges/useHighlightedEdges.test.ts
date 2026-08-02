// @vitest-environment jsdom
import type { IModule } from 'dependency-cruiser';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { act, renderHook } from '@testing-library/react';
import type { Edge } from '@xyflow/react';

import { useHighlightedEdges } from './useHighlightedEdges';

const modules = [
  {
    source: 'a.ts',
    dependencies: [{ resolved: 'b.ts', module: './b', moduleSystem: 'es6', dynamic: false }],
  },
  {
    source: 'b.ts',
    dependencies: [],
  },
] as IModule[];

const baseEdges: Edge[] = [{ id: 'a.ts->b.ts', source: 'a.ts', target: 'b.ts' }];

function useHighlightedEdgesHarness(overrides: Partial<Parameters<typeof useHighlightedEdges>[0]> = {}) {
  const [userEdgeHighlights, setUserEdgeHighlights] = useState<ReadonlyMap<string, string>>(() => new Map());

  return useHighlightedEdges({
    modules,
    selectedPaths: ['a.ts', 'b.ts'],
    expandedFolders: new Set(),
    baseEdges,
    visibleNodeIds: new Set(['a.ts', 'b.ts']),
    activePath: null,
    userEdgeHighlights,
    onUserEdgeHighlightsChange: setUserEdgeHighlights,
    ...overrides,
  });
}

function renderHighlighted(overrides: Partial<Parameters<typeof useHighlightedEdges>[0]> = {}) {
  return renderHook(() => useHighlightedEdgesHarness(overrides));
}

describe('useHighlightedEdges', () => {
  it('selects an edge on click and clears selection', () => {
    const { result } = renderHighlighted();

    act(() => {
      result.current.onEdgeClick({} as never, baseEdges[0]);
    });

    expect(result.current.highlightedEdges[0]?.zIndex).toBe(1000);
    expect(result.current.highlightedEdges[0]?.style?.strokeWidth).toBe(3);

    act(() => {
      result.current.clearSelectedEdge();
    });

    expect(result.current.highlightedEdges[0]?.zIndex).not.toBe(1000);
  });

  it('drops selectedEdgeId when the edge leaves baseEdges', () => {
    const { result, rerender } = renderHook(({ edges }) => useHighlightedEdgesHarness({ baseEdges: edges }), {
      initialProps: { edges: baseEdges },
    });

    act(() => {
      result.current.onEdgeClick({} as never, baseEdges[0]);
    });
    expect(result.current.highlightedEdges[0]?.zIndex).toBe(1000);

    rerender({ edges: [] });
    expect(result.current.highlightedEdges).toEqual([]);
  });

  it('sets and clears user edge highlights', () => {
    const { result } = renderHighlighted();

    act(() => {
      result.current.setUserEdgeHighlight('a.ts->b.ts', '#ff0000');
    });

    expect(result.current.getEdgeHighlight('a.ts->b.ts')).toBe('#ff0000');

    act(() => {
      result.current.setUserEdgeHighlight('a.ts->b.ts', null);
    });

    expect(result.current.getEdgeHighlight('a.ts->b.ts')).toBeUndefined();
  });

  it('ignores highlight for unknown edge ids', () => {
    const { result } = renderHighlighted();

    act(() => {
      result.current.setUserEdgeHighlight('missing', '#ff0000');
    });

    expect(result.current.getEdgeHighlight('missing')).toBeUndefined();
  });

  it('filters stale user highlights when selection shrinks', () => {
    const { result, rerender } = renderHook(
      ({ selectedPaths }) =>
        useHighlightedEdgesHarness({
          selectedPaths,
          visibleNodeIds: new Set(selectedPaths),
        }),
      { initialProps: { selectedPaths: ['a.ts', 'b.ts'] } },
    );

    act(() => {
      result.current.setUserEdgeHighlight('a.ts->b.ts', '#ff0000');
    });
    expect(result.current.getEdgeHighlight('a.ts->b.ts')).toBe('#ff0000');

    rerender({ selectedPaths: ['a.ts'] });
    expect(result.current.getEdgeHighlight('a.ts->b.ts')).toBeUndefined();
  });
});
