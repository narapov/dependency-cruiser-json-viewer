// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import type { LayoutCache } from '../../helpers';
import type { BuildGraphResult, VisibleTreeLayoutedNode } from '../../types';
import { useCustomPositionedGraph } from './useCustomPositionedGraph';

vi.mock('../useLibavoidEdgeRouting', () => ({
  useLibavoidEdgeRouting: () => ({
    routedEdges: [],
    routingProgress: null,
  }),
}));

function makeLayoutedNode(path: string, overrides: Partial<VisibleTreeLayoutedNode> = {}): VisibleTreeLayoutedNode {
  return {
    path,
    ancestors: [],
    descendants: [],
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
    edgesPorts: new Map(),
  };
}

const emptyGraphResult = makeGraphResult([]);

function renderCustomPositionedHook(
  graphResult: BuildGraphResult,
  overrides: {
    autoLayoutOnly?: boolean;
    isDragging?: boolean;
    onRequestRebuild?: () => void;
    layoutCacheRef?: { current: LayoutCache };
    bumpCommitRevision?: () => void;
    commitRevision?: number;
    nodeLayoutsRevision?: number;
  } = {},
) {
  const layoutCacheRef = overrides.layoutCacheRef ?? { current: new Map() as LayoutCache };
  return renderHook(() =>
    useCustomPositionedGraph({
      graphResult,
      layoutCacheRef,
      commitRevision: overrides.commitRevision ?? 0,
      nodeLayoutsRevision: overrides.nodeLayoutsRevision ?? 0,
      edgesType: 'bezier',
      isDragging: overrides.isDragging ?? false,
      autoLayoutOnly: overrides.autoLayoutOnly,
      bumpCommitRevision: overrides.bumpCommitRevision ?? vi.fn(),
      onRequestRebuild: overrides.onRequestRebuild,
    }),
  );
}

describe('useCustomPositionedGraph', () => {
  it('seeds positioned nodes from graphResult', () => {
    const graphResult = makeGraphResult([
      makeLayoutedNode('a.ts', { position: { x: 10, y: 20 } }),
      makeLayoutedNode('b.ts'),
    ]);

    const { result } = renderCustomPositionedHook(graphResult);

    expect(result.current.positionedNodes.get('a.ts')?.position).toEqual({ x: 10, y: 20 });
    expect(result.current.positionedNodes.has('b.ts')).toBe(true);
  });

  it('merges visible group layouts into the cache when the tree identity changes', () => {
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
        useCustomPositionedGraph({
          graphResult,
          layoutCacheRef,
          commitRevision: 0,
          nodeLayoutsRevision: 0,
          edgesType: 'bezier',
          isDragging: false,
          bumpCommitRevision: vi.fn(),
        }),
      { initialProps: { graphResult: firstGraph } },
    );

    rerender({ graphResult: secondGraph });

    expect(layoutCacheRef.current.get('src/hidden')).toBeDefined();
    expect(layoutCacheRef.current.get(null)?.children.get('a.ts')?.position).toEqual({ x: 9, y: 9 });
  });

  it('invalidates a folder cache entry and requests rebuild on auto layout', () => {
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

    const { result } = renderCustomPositionedHook(emptyGraphResult, { layoutCacheRef, onRequestRebuild });

    act(() => {
      result.current.onAutoLayoutGroup('src');
    });

    expect(layoutCacheRef.current.has('src')).toBe(false);
    expect(layoutCacheRef.current.has('src/foo')).toBe(true);
    expect(onRequestRebuild).toHaveBeenCalledTimes(1);
  });

  it('updates cache on apply and bumps commit revision only when commit is true', () => {
    const bumpCommitRevision = vi.fn();
    const layoutCacheRef = { current: new Map() as LayoutCache };
    const graphResult = makeGraphResult([makeLayoutedNode('a.ts', { position: { x: 0, y: 0 } })]);

    const { result } = renderCustomPositionedHook(graphResult, { layoutCacheRef, bumpCommitRevision });

    let reflowed: Map<string, VisibleTreeLayoutedNode> = new Map();
    act(() => {
      reflowed = result.current.applyNodePositionToCache('a.ts', { x: 5, y: 5 });
    });

    expect(reflowed.get('a.ts')?.position).toEqual({ x: 5, y: 5 });
    expect(layoutCacheRef.current.get(null)?.children.get('a.ts')?.position).toEqual({ x: 5, y: 5 });
    expect(bumpCommitRevision).not.toHaveBeenCalled();

    act(() => {
      result.current.applyNodePositionToCache('a.ts', { x: 5, y: 5 }, { commit: true });
    });

    expect(bumpCommitRevision).toHaveBeenCalledTimes(1);
  });
});
