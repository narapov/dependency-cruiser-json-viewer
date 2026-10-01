// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';
import type { Node } from '@xyflow/react';

import type { BuildGraphResult, VisibleTreeLayoutedNode } from '../../types';
import { usePendingFocusNode } from './usePendingFocusNode';

const fitView = vi.hoisted(() => vi.fn(() => Promise.resolve(true)));
const getNode = vi.hoisted(() => vi.fn((id: string) => (id === 'src/a.ts' ? { id } : undefined)));

vi.mock('@xyflow/react', () => ({
  useReactFlow: () => ({ fitView, getNode }),
}));

function stubLayoutNode(id: string): Node {
  return { id, position: { x: 0, y: 0 }, data: {} };
}

function stubTreeNode(path: string): VisibleTreeLayoutedNode {
  return {
    path,
    valueCircular: false,
    typeOnlyCircular: false,
    position: { x: 0, y: 0 },
    width: 120,
    height: 32,
  };
}

function emptyGraphResult(overrides: Partial<BuildGraphResult> = {}): BuildGraphResult {
  return {
    nodes: new Map(),
    tree: new Map(),
    edges: [],
    visibleGroupLayouts: {},
    ...overrides,
  };
}

function graphResultWith(...paths: string[]): BuildGraphResult {
  const rootNodes = paths.map(stubTreeNode);
  return {
    nodes: new Map(rootNodes.map(node => [node.path, node])),
    tree: new Map(rootNodes.map(node => [node.path, node])),
    edges: [],
    visibleGroupLayouts: {},
  };
}

describe('usePendingFocusNode', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    fitView.mockClear();
    getNode.mockClear();
    getNode.mockImplementation((id: string) => (id === 'src/a.ts' ? { id } : undefined));
  });

  it('fits view immediately when the node exists', () => {
    const { result } = renderHook(() =>
      usePendingFocusNode({
        isBuildingGraph: false,
        graphResult: emptyGraphResult(),
        layoutNodes: [],
      }),
    );

    act(() => {
      result.current.focusNode('src/a.ts');
    });

    expect(fitView).toHaveBeenCalledWith({ nodes: [{ id: 'src/a.ts' }], padding: 0.5, duration: 300 });
  });

  it('does not fit immediately when the node is missing', () => {
    const { result } = renderHook(() =>
      usePendingFocusNode({
        isBuildingGraph: true,
        graphResult: emptyGraphResult(),
        layoutNodes: [],
      }),
    );

    act(() => {
      result.current.focusNode('src/pending.ts');
    });

    expect(fitView).not.toHaveBeenCalled();
  });

  it('fits view after rebuild when the node appears in layoutNodes', () => {
    const pendingLayout = stubLayoutNode('src/pending.ts');
    const { result, rerender } = renderHook(
      ({ isBuildingGraph, graphResult, layoutNodes }) =>
        usePendingFocusNode({ isBuildingGraph, graphResult, layoutNodes }),
      {
        initialProps: {
          isBuildingGraph: true,
          graphResult: emptyGraphResult(),
          layoutNodes: [] as Node[],
        },
      },
    );

    act(() => {
      result.current.focusNode('src/pending.ts');
    });
    expect(fitView).not.toHaveBeenCalled();

    rerender({
      isBuildingGraph: false,
      graphResult: graphResultWith('src/pending.ts'),
      layoutNodes: [],
    });
    expect(fitView).not.toHaveBeenCalled();

    rerender({
      isBuildingGraph: false,
      graphResult: graphResultWith('src/pending.ts'),
      layoutNodes: [pendingLayout],
    });

    expect(fitView).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(fitView).toHaveBeenCalledWith({
      nodes: [{ id: 'src/pending.ts' }],
      padding: 0.5,
      duration: 300,
    });
  });

  it('skips deferred fitView when pending path changes during the timeout', () => {
    const pendingLayout = stubLayoutNode('src/pending.ts');
    const { result, rerender } = renderHook(
      ({ isBuildingGraph, graphResult, layoutNodes }) =>
        usePendingFocusNode({ isBuildingGraph, graphResult, layoutNodes }),
      {
        initialProps: {
          isBuildingGraph: true,
          graphResult: emptyGraphResult(),
          layoutNodes: [] as Node[],
        },
      },
    );

    act(() => {
      result.current.focusNode('src/pending.ts');
    });

    rerender({
      isBuildingGraph: false,
      graphResult: graphResultWith('src/pending.ts'),
      layoutNodes: [pendingLayout],
    });

    expect(fitView).not.toHaveBeenCalled();

    act(() => {
      result.current.focusNode('src/a.ts');
    });

    expect(fitView).toHaveBeenCalledTimes(1);
    expect(fitView).toHaveBeenCalledWith({
      nodes: [{ id: 'src/a.ts' }],
      padding: 0.5,
      duration: 300,
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(fitView).toHaveBeenCalledTimes(1);
  });

  it('drops pending focus when rebuild finishes without the node', () => {
    const otherLayout = stubLayoutNode('src/other.ts');
    const missingLayout = stubLayoutNode('src/missing.ts');
    const { result, rerender } = renderHook(
      ({ isBuildingGraph, graphResult, layoutNodes }) =>
        usePendingFocusNode({ isBuildingGraph, graphResult, layoutNodes }),
      {
        initialProps: {
          isBuildingGraph: true,
          graphResult: emptyGraphResult(),
          layoutNodes: [] as Node[],
        },
      },
    );

    act(() => {
      result.current.focusNode('src/missing.ts');
    });

    rerender({
      isBuildingGraph: false,
      graphResult: graphResultWith('src/other.ts'),
      layoutNodes: [otherLayout],
    });

    expect(fitView).not.toHaveBeenCalled();

    rerender({
      isBuildingGraph: false,
      graphResult: graphResultWith('src/other.ts', 'src/missing.ts'),
      layoutNodes: [otherLayout, missingLayout],
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Pending was cleared after the earlier rebuild without the node.
    expect(fitView).not.toHaveBeenCalled();
  });
});
