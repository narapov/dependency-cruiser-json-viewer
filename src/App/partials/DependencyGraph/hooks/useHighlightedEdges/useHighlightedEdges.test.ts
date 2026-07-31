// @vitest-environment jsdom
import type { IModule } from 'dependency-cruiser';
import { afterEach, describe, expect, it } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';
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

function renderHighlighted(overrides: Partial<Parameters<typeof useHighlightedEdges>[0]> = {}) {
  return renderHook(() =>
    useHighlightedEdges({
      modules,
      selectedPaths: ['a.ts', 'b.ts'],
      expandedFolders: new Set(),
      baseEdges,
      visibleNodeIds: new Set(['a.ts', 'b.ts']),
      activePath: null,
      ...overrides,
    }),
  );
}

describe('useHighlightedEdges', () => {
  afterEach(() => {
    cleanup();
  });

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
    const { result, rerender } = renderHook(
      ({ edges }) =>
        useHighlightedEdges({
          modules,
          selectedPaths: ['a.ts', 'b.ts'],
          expandedFolders: new Set(),
          baseEdges: edges,
          visibleNodeIds: new Set(['a.ts', 'b.ts']),
        }),
      { initialProps: { edges: baseEdges } },
    );

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

  it('clearAllHighlights removes user highlights', () => {
    const { result } = renderHighlighted();

    act(() => {
      result.current.setUserEdgeHighlight('a.ts->b.ts', '#00ff00');
    });
    expect(result.current.getEdgeHighlight('a.ts->b.ts')).toBe('#00ff00');

    act(() => {
      result.current.clearAllHighlights();
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
        useHighlightedEdges({
          modules,
          selectedPaths,
          expandedFolders: new Set(),
          baseEdges,
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
