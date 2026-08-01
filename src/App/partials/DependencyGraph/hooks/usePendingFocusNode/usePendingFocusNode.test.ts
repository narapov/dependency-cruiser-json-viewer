// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';
import type { Node } from '@xyflow/react';

import type { BuildGraphResult } from '../../types';
import { usePendingFocusNode } from './usePendingFocusNode';

const fitView = vi.hoisted(() => vi.fn(() => Promise.resolve(true)));
const getNode = vi.hoisted(() => vi.fn((id: string) => (id === 'src/a.ts' ? { id } : undefined)));

vi.mock('@xyflow/react', () => ({
  useReactFlow: () => ({ fitView, getNode }),
}));

function stubNode(id: string): Node {
  return { id, position: { x: 0, y: 0 }, data: {} };
}

function emptyGraphResult(overrides: Partial<BuildGraphResult> = {}): BuildGraphResult {
  return {
    nodes: [],
    edges: [],
    visibleNodeIds: new Set(),
    parentByNode: new Map(),
    ...overrides,
  };
}

describe('usePendingFocusNode', () => {
  afterEach(() => {
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
    const pendingNode = stubNode('src/pending.ts');
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
      graphResult: emptyGraphResult({ nodes: [pendingNode] }),
      layoutNodes: [],
    });
    expect(fitView).not.toHaveBeenCalled();

    rerender({
      isBuildingGraph: false,
      graphResult: emptyGraphResult({ nodes: [pendingNode] }),
      layoutNodes: [pendingNode],
    });

    expect(fitView).toHaveBeenCalledWith({
      nodes: [{ id: 'src/pending.ts' }],
      padding: 0.5,
      duration: 300,
    });
  });

  it('drops pending focus when rebuild finishes without the node', () => {
    const otherNode = stubNode('src/other.ts');
    const missingNode = stubNode('src/missing.ts');
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
      graphResult: emptyGraphResult({ nodes: [otherNode] }),
      layoutNodes: [otherNode],
    });

    expect(fitView).not.toHaveBeenCalled();

    rerender({
      isBuildingGraph: false,
      graphResult: emptyGraphResult({ nodes: [otherNode, missingNode] }),
      layoutNodes: [otherNode, missingNode],
    });

    // Pending was cleared after the earlier rebuild without the node.
    expect(fitView).not.toHaveBeenCalled();
  });
});
