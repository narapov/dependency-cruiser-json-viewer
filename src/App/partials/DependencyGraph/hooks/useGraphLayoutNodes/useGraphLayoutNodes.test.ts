// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';
import type { Node } from '@xyflow/react';

import type { BuildGraphResult } from '../../types';
import { useGraphLayoutNodes } from './useGraphLayoutNodes';

vi.mock('../../helpers', async importOriginal => {
  const actual = await importOriginal<typeof import('../../helpers')>();
  return {
    ...actual,
    buildGroupFingerprints: vi.fn(() => new Map()),
    invalidatePositionCache: vi.fn(),
    preserveExpandedGroupPositions: vi.fn((nodes: Node[]) => nodes),
    applyPositionCache: vi.fn((nodes: Node[]) => nodes),
    reflowParentSiblings: vi.fn(({ nodes }: { nodes: Node[] }) => nodes),
    collectNodeSizes: vi.fn(() => new Map()),
    reflowForDrag: vi.fn((nodes: Node[]) => nodes),
    compactAfterDrag: vi.fn((nodes: Node[]) => nodes),
    updateGroupCacheFromNodes: vi.fn(),
    invalidateGroupPositionCache: vi.fn(),
    invalidateGroupPositionCacheRecursive: vi.fn(),
    applyAutoLayoutSubtree: vi.fn((current: Node[]) => current),
    applyAutoLayoutGroupLevel: vi.fn((current: Node[]) => current),
    updateSubtreeGroupCaches: vi.fn(),
    updateGroupPositionCache: vi.fn(),
  };
});

function makeNode(id: string, overrides: Partial<Node> = {}): Node {
  return {
    id,
    position: { x: 0, y: 0 },
    data: {},
    ...overrides,
  };
}

function makeGraphResult(nodes: Node[]): BuildGraphResult {
  return {
    nodes,
    edges: [],
    visibleNodeIds: new Set(nodes.map(node => node.id)),
    parentByNode: new Map(),
  };
}

describe('useGraphLayoutNodes', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('applies graphResult nodes into React Flow state', async () => {
    const graphResult = makeGraphResult([makeNode('a.ts', { position: { x: 10, y: 20 } }), makeNode('b.ts')]);

    const { result } = renderHook(() => useGraphLayoutNodes({ graphResult }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.nodes.map(node => node.id)).toEqual(['a.ts', 'b.ts']);
    expect(result.current.hasUserLayout).toBe(false);
  });

  it('marks nodes non-draggable in autoLayoutOnly mode', async () => {
    const graphResult = makeGraphResult([makeNode('a.ts')]);

    const { result } = renderHook(() => useGraphLayoutNodes({ graphResult, autoLayoutOnly: true }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.nodes[0]?.draggable).toBe(false);
    expect(result.current.hasUserLayout).toBe(false);
  });

  it('ignores drag handlers in autoLayoutOnly mode', async () => {
    const graphResult = makeGraphResult([makeNode('a.ts')]);
    const { result } = renderHook(() => useGraphLayoutNodes({ graphResult, autoLayoutOnly: true }));

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      const node = makeNode('a.ts', { position: { x: 50, y: 50 } });
      result.current.onNodeDrag({} as never, node, [node]);
    });
    act(() => {
      const node = makeNode('a.ts', { position: { x: 50, y: 50 } });
      result.current.onNodeDragStop({} as never, node, [node]);
    });

    expect(result.current.hasUserLayout).toBe(false);
  });

  it('sets hasUserLayout after drag stop', async () => {
    const graphResult = makeGraphResult([makeNode('a.ts')]);
    const { result } = renderHook(() => useGraphLayoutNodes({ graphResult }));

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      const node = {
        ...result.current.nodes[0],
        position: { x: 40, y: 10 },
      };
      result.current.onNodeDragStop({} as never, node, [node]);
    });

    expect(result.current.hasUserLayout).toBe(true);
  });

  it('attaches auto-layout callbacks to folderGroup nodes', async () => {
    const folder = makeNode('src', {
      type: 'folderGroup',
      data: { label: 'src' },
    });
    const graphResult = makeGraphResult([folder]);

    const { result } = renderHook(() => useGraphLayoutNodes({ graphResult }));

    await act(async () => {
      await Promise.resolve();
    });

    const folderNode = result.current.nodes.find(node => node.id === 'src');
    expect(folderNode?.data).toMatchObject({
      onAutoLayoutGroup: expect.any(Function),
      onAutoLayoutGroupRecursive: expect.any(Function),
    });
  });

  it('resets hasUserLayout when switching to autoLayoutOnly', async () => {
    const graphResult = makeGraphResult([makeNode('a.ts')]);
    const { result, rerender } = renderHook(
      ({ autoLayoutOnly }) => useGraphLayoutNodes({ graphResult, autoLayoutOnly }),
      { initialProps: { autoLayoutOnly: false } },
    );

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      const node = {
        ...result.current.nodes[0],
        position: { x: 30, y: 30 },
      };
      result.current.onNodeDragStop({} as never, node, [node]);
    });
    expect(result.current.hasUserLayout).toBe(true);

    rerender({ autoLayoutOnly: true });
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.hasUserLayout).toBe(false);
  });

  it('defers layout restore until graphResult has nodes, then keeps positions', async () => {
    const { invalidatePositionCache } = await import('../../helpers');
    const emptyGraph = makeGraphResult([]);
    const readyGraph = makeGraphResult([makeNode('src/a.ts'), makeNode('src/b.ts')]);
    const restoredPositions = {
      '': { 'src/a.ts': { x: 10, y: 20 }, 'src/b.ts': { x: 30, y: 40 } },
    };

    const { result, rerender } = renderHook(
      ({ graphResult }) => useGraphLayoutNodes({ graphResult, autoLayoutOnly: false }),
      { initialProps: { graphResult: emptyGraph } },
    );

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.setLayoutSnapshot({ nodePositions: restoredPositions });
    });

    expect(result.current.hasUserLayout).toBe(true);
    expect(result.current.getLayoutSnapshot().nodePositions).toEqual({});

    vi.mocked(invalidatePositionCache).mockClear();

    rerender({ graphResult: readyGraph });
    await act(async () => {
      await Promise.resolve();
    });

    expect(invalidatePositionCache).not.toHaveBeenCalled();
    expect(result.current.getLayoutSnapshot().nodePositions).toEqual(restoredPositions);
  });

  it('clears previous sizes and nodes before applying a restored layout', async () => {
    const { reflowParentSiblings, preserveExpandedGroupPositions, collectNodeSizes } = await import('../../helpers');
    const firstGraph = makeGraphResult([makeNode('old.ts', { position: { x: 1, y: 1 }, width: 120, height: 32 })]);
    const secondGraph = makeGraphResult([makeNode('old.ts', { position: { x: 2, y: 2 }, width: 140, height: 40 })]);
    const previousSizes = new Map([['old.ts', { width: 120, height: 32 }]]);
    vi.mocked(collectNodeSizes).mockReturnValue(previousSizes);

    const { result, rerender } = renderHook(
      ({ graphResult }) => useGraphLayoutNodes({ graphResult, autoLayoutOnly: false }),
      { initialProps: { graphResult: firstGraph } },
    );

    await act(async () => {
      await Promise.resolve();
    });

    rerender({ graphResult: secondGraph });
    await act(async () => {
      await Promise.resolve();
    });

    const callBeforeRestore = vi.mocked(reflowParentSiblings).mock.calls.at(-1)?.[0];
    expect(callBeforeRestore?.previousSizes).toBe(previousSizes);
    expect(callBeforeRestore?.previousNodes).toEqual(firstGraph.nodes);

    vi.mocked(reflowParentSiblings).mockClear();
    vi.mocked(preserveExpandedGroupPositions).mockClear();

    act(() => {
      result.current.setLayoutSnapshot({
        nodePositions: {
          '': { 'old.ts': { x: 10, y: 20 } },
        },
      });
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(vi.mocked(preserveExpandedGroupPositions)).toHaveBeenCalledWith(secondGraph.nodes, null);
    const callAfterRestore = vi.mocked(reflowParentSiblings).mock.calls.at(-1)?.[0];
    expect(callAfterRestore?.previousSizes).toEqual(new Map());
    expect(callAfterRestore?.previousNodes).toBeNull();
  });
});
