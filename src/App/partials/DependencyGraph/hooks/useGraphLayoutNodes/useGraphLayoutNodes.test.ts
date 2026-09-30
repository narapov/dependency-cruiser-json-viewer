// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';
import type { Node } from '@xyflow/react';

import type { CruiseSnapshot } from '@/domain';

import { toReactFlowNodes } from '../../helpers';
import type { BuildGraphResult, VisibleTreeLayoutedNode } from '../../types';
import { useGraphLayoutNodes } from './useGraphLayoutNodes';

const emptyCruiseSnapshot = { nodes: new Map() } as CruiseSnapshot;
const emptyFolderColors = new Map<string, string>();

vi.mock('../../helpers', async importOriginal => {
  const actual = await importOriginal<typeof import('../../helpers')>();
  return {
    ...actual,
    buildGroupFingerprints: vi.fn(() => new Map()),
    invalidatePositionCache: vi.fn(),
    preserveExpandedGroupPositions: vi.fn((nodes: Node[]) => nodes),
    migrateReparentedNodePositions: vi.fn((nodes: Node[]) => nodes),
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

function makeLayoutedNode(path: string, overrides: Partial<VisibleTreeLayoutedNode> = {}): VisibleTreeLayoutedNode {
  return {
    path,
    valueCircular: false,
    typeOnlyCircular: false,
    position: { x: 0, y: 0 },
    width: 120,
    height: 32,
    ...overrides,
  };
}

function makeGraphResult(rootNodes: VisibleTreeLayoutedNode[]): BuildGraphResult {
  const nodes = new Map<string, VisibleTreeLayoutedNode>();
  const visit = (node: VisibleTreeLayoutedNode) => {
    nodes.set(node.path, node);
    node.children?.forEach(visit);
  };
  rootNodes.forEach(visit);

  return {
    nodes,
    tree: new Map(rootNodes.map(node => [node.path, node])),
    edges: [],
  };
}

function renderLayoutHook(
  graphResult: BuildGraphResult,
  overrides: { autoLayoutOnly?: boolean; cruiseSnapshot?: CruiseSnapshot } = {},
) {
  return renderHook(() =>
    useGraphLayoutNodes({
      cruiseSnapshot: overrides.cruiseSnapshot ?? emptyCruiseSnapshot,
      folderColors: emptyFolderColors,
      graphResult,
      autoLayoutOnly: overrides.autoLayoutOnly,
    }),
  );
}

describe('useGraphLayoutNodes', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('applies graphResult nodes into React Flow state', async () => {
    const graphResult = makeGraphResult([
      makeLayoutedNode('a.ts', { position: { x: 10, y: 20 } }),
      makeLayoutedNode('b.ts'),
    ]);

    const { result } = renderLayoutHook(graphResult);

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.nodes.map(node => node.id)).toEqual(['a.ts', 'b.ts']);
    expect(result.current.nodes.find(node => node.id === 'a.ts')?.position).toEqual({ x: 10, y: 20 });
  });

  it('disables dragging when autoLayoutOnly is true', async () => {
    const graphResult = makeGraphResult([makeLayoutedNode('a.ts')]);

    const { result } = renderLayoutHook(graphResult, { autoLayoutOnly: true });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.nodes[0]?.draggable).toBe(false);
  });

  it('ignores drag when autoLayoutOnly is true', async () => {
    const graphResult = makeGraphResult([makeLayoutedNode('a.ts')]);
    const { result } = renderLayoutHook(graphResult, { autoLayoutOnly: true });

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      const node = result.current.nodes[0]!;
      result.current.onNodeDrag({} as never, node, [node]);
    });
    act(() => {
      const node = { ...result.current.nodes[0]!, position: { x: 50, y: 50 } };
      result.current.onNodeDragStop({} as never, node, [node]);
    });

    expect(result.current.hasUserLayout).toBe(false);
  });

  it('sets hasUserLayout after drag stop', async () => {
    const graphResult = makeGraphResult([makeLayoutedNode('a.ts')]);
    const { result } = renderLayoutHook(graphResult);

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      const node = {
        ...result.current.nodes[0]!,
        position: { x: 40, y: 10 },
      };
      result.current.onNodeDragStop({} as never, node, [node]);
    });

    expect(result.current.hasUserLayout).toBe(true);
  });

  it('returns auto-layout callbacks from the hook', async () => {
    const graphResult = makeGraphResult([
      makeLayoutedNode('src', {
        children: [],
        width: 200,
        height: 100,
      }),
    ]);

    const { result } = renderLayoutHook(graphResult);

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.onAutoLayoutGroup).toEqual(expect.any(Function));
    expect(result.current.onAutoLayoutGroupRecursive).toEqual(expect.any(Function));

    const folderNode = result.current.nodes.find(node => node.id === 'src');
    expect(folderNode?.data).not.toHaveProperty('onAutoLayoutGroup');
    expect(folderNode?.data).not.toHaveProperty('onAutoLayoutGroupRecursive');
  });

  it('resets hasUserLayout when switching to autoLayoutOnly', async () => {
    const graphResult = makeGraphResult([makeLayoutedNode('a.ts')]);
    const { result, rerender } = renderHook(
      ({ autoLayoutOnly }) =>
        useGraphLayoutNodes({
          cruiseSnapshot: emptyCruiseSnapshot,
          folderColors: emptyFolderColors,
          graphResult,
          autoLayoutOnly,
        }),
      { initialProps: { autoLayoutOnly: false } },
    );

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      const node = {
        ...result.current.nodes[0]!,
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
    const readyGraph = makeGraphResult([makeLayoutedNode('src/a.ts'), makeLayoutedNode('src/b.ts')]);
    const restoredPositions = {
      '': { 'src/a.ts': { x: 10, y: 20 }, 'src/b.ts': { x: 30, y: 40 } },
    };

    const { result, rerender } = renderHook(
      ({ graphResult }) =>
        useGraphLayoutNodes({
          cruiseSnapshot: emptyCruiseSnapshot,
          folderColors: emptyFolderColors,
          graphResult,
          autoLayoutOnly: false,
        }),
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
    const firstGraph = makeGraphResult([
      makeLayoutedNode('old.ts', { position: { x: 1, y: 1 }, width: 120, height: 32 }),
    ]);
    const secondGraph = makeGraphResult([
      makeLayoutedNode('old.ts', { position: { x: 2, y: 2 }, width: 140, height: 40 }),
    ]);
    const firstReactFlowNodes = toReactFlowNodes(firstGraph.nodes, emptyCruiseSnapshot, emptyFolderColors).nodes;
    const secondReactFlowNodes = toReactFlowNodes(secondGraph.nodes, emptyCruiseSnapshot, emptyFolderColors).nodes;
    const previousSizes = new Map([['old.ts', { width: 120, height: 32 }]]);
    vi.mocked(collectNodeSizes).mockReturnValue(previousSizes);

    const { result, rerender } = renderHook(
      ({ graphResult }) =>
        useGraphLayoutNodes({
          cruiseSnapshot: emptyCruiseSnapshot,
          folderColors: emptyFolderColors,
          graphResult,
          autoLayoutOnly: false,
        }),
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
    expect(callBeforeRestore?.previousNodes).toEqual(firstReactFlowNodes);

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

    expect(vi.mocked(preserveExpandedGroupPositions)).toHaveBeenCalledWith(secondReactFlowNodes, null);
    const callAfterRestore = vi.mocked(reflowParentSiblings).mock.calls.at(-1)?.[0];
    expect(callAfterRestore?.previousSizes).toEqual(new Map());
    expect(callAfterRestore?.previousNodes).toBeNull();
  });
});
