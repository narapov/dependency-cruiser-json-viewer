// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import type { CruiseSnapshot } from '@/domain';

import type { LayoutCache } from '../../helpers';
import type { BuildGraphResult, VisibleTreeLayoutedNode } from '../../types';
import { useGraphLayoutNodes } from './useGraphLayoutNodes';

const emptyCruiseSnapshot = { nodes: new Map(), rules: [] } as unknown as CruiseSnapshot;
const emptyFolderColors = new Map<string, string>();

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

function makeGraphResult(
  rootNodes: VisibleTreeLayoutedNode[],
  visibleGroupLayouts: BuildGraphResult['visibleGroupLayouts'] = {},
): BuildGraphResult {
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
    visibleGroupLayouts,
    edgePortsById: new Map(),
  };
}

const emptyGraphResult = makeGraphResult([]);

function renderLayoutHook(
  graphResult: BuildGraphResult,
  overrides: {
    autoLayoutOnly?: boolean;
    onRequestRebuild?: () => void;
    layoutCacheRef?: { current: LayoutCache };
  } = {},
) {
  const layoutCacheRef = overrides.layoutCacheRef ?? { current: new Map() as LayoutCache };
  return renderHook(() =>
    useGraphLayoutNodes({
      cruiseSnapshot: emptyCruiseSnapshot,
      folderColors: emptyFolderColors,
      graphResult,
      layoutCacheRef,
      autoLayoutOnly: overrides.autoLayoutOnly,
      onRequestRebuild: overrides.onRequestRebuild,
    }),
  );
}

describe('useGraphLayoutNodes', () => {
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

  it('merges visible group layouts into the cache while preserving hidden entries', async () => {
    const layoutCacheRef = {
      current: new Map([
        [
          'src/hidden',
          {
            id: 'src/hidden',
            width: 50,
            height: 40,
            children: new Map([
              ['src/hidden/x.ts', { id: 'src/hidden/x.ts', position: { x: 1, y: 2 }, width: 10, height: 10 }],
            ]),
          },
        ],
      ]) as LayoutCache,
    };

    const firstGraph = makeGraphResult([makeLayoutedNode('a.ts')], {
      '': {
        id: '',
        width: 200,
        height: 100,
        children: {
          'a.ts': { id: 'a.ts', position: { x: 5, y: 6 }, width: 120, height: 32 },
        },
      },
    });
    const secondGraph = makeGraphResult([makeLayoutedNode('a.ts', { position: { x: 9, y: 9 } })], {
      '': {
        id: '',
        width: 200,
        height: 100,
        children: {
          'a.ts': { id: 'a.ts', position: { x: 9, y: 9 }, width: 120, height: 32 },
        },
      },
    });

    const { rerender } = renderHook(
      ({ graphResult }) =>
        useGraphLayoutNodes({
          cruiseSnapshot: emptyCruiseSnapshot,
          folderColors: emptyFolderColors,
          graphResult,
          layoutCacheRef,
        }),
      { initialProps: { graphResult: firstGraph } },
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(layoutCacheRef.current.get('src/hidden')?.children.get('src/hidden/x.ts')?.position).toEqual({
      x: 1,
      y: 2,
    });
    expect(layoutCacheRef.current.get(null)?.children.get('a.ts')?.position).toEqual({ x: 5, y: 6 });

    rerender({ graphResult: secondGraph });

    await act(async () => {
      await Promise.resolve();
    });

    expect(layoutCacheRef.current.get('src/hidden')).toBeDefined();
  });

  it('invalidates a folder cache entry and requests rebuild on auto layout', async () => {
    const onRequestRebuild = vi.fn();
    const layoutCacheRef = { current: new Map() as LayoutCache };
    layoutCacheRef.current.set('src', {
      id: 'src',
      width: 100,
      height: 80,
      children: new Map([['src/a.ts', { id: 'src/a.ts', position: { x: 0, y: 0 }, width: 10, height: 10 }]]),
    });
    layoutCacheRef.current.set('src/foo', {
      id: 'src/foo',
      width: 50,
      height: 40,
      children: new Map(),
    });

    const { result } = renderLayoutHook(emptyGraphResult, { layoutCacheRef, onRequestRebuild });

    act(() => {
      result.current.onAutoLayoutGroup('src');
    });

    expect(layoutCacheRef.current.has('src')).toBe(false);
    expect(layoutCacheRef.current.has('src/foo')).toBe(true);
    expect(onRequestRebuild).toHaveBeenCalledTimes(1);
  });

  it('invalidates descendant group entries on recursive auto layout', async () => {
    const onRequestRebuild = vi.fn();
    const layoutCacheRef = { current: new Map() as LayoutCache };
    layoutCacheRef.current.set('src', {
      id: 'src',
      width: 100,
      height: 80,
      children: new Map(),
    });
    layoutCacheRef.current.set('src/foo', {
      id: 'src/foo',
      width: 50,
      height: 40,
      children: new Map(),
    });

    const { result } = renderLayoutHook(emptyGraphResult, { layoutCacheRef, onRequestRebuild });

    act(() => {
      result.current.onAutoLayoutGroupRecursive('src');
    });

    expect(layoutCacheRef.current.has('src')).toBe(false);
    expect(layoutCacheRef.current.has('src/foo')).toBe(false);
    expect(onRequestRebuild).toHaveBeenCalledTimes(1);
  });

  it('restores a layout snapshot into the cache', async () => {
    const { result } = renderLayoutHook(makeGraphResult([makeLayoutedNode('a.ts')]));

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.setLayoutSnapshot({
        nodeLayouts: {
          '': {
            id: '',
            width: 100,
            height: 80,
            children: {
              'a.ts': { id: 'a.ts', position: { x: 11, y: 22 }, width: 120, height: 32 },
            },
          },
        },
      });
    });

    expect(result.current.hasUserLayout).toBe(true);
  });
});
