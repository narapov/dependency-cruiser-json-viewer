// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import type { CruiseSnapshot } from '@/domain';

import type { VisibleTreeLayoutedNode } from '../../types';
import { useReactFlowGraph } from './useReactFlowGraph';

const emptyCruiseSnapshot = { nodes: new Map(), rules: [] } as unknown as CruiseSnapshot;
const emptyFolderColors = new Map<string, string>();

function makeLayoutedNode(path: string): VisibleTreeLayoutedNode {
  return {
    path,
    ancestors: [],
    descendants: [],
    valueCircular: false,
    typeOnlyCircular: false,
    position: { x: 0, y: 0 },
    width: 120,
    height: 32,
  };
}

describe('useReactFlowGraph', () => {
  it('projects positioned nodes into React Flow state', async () => {
    const positionedNodes = new Map([['a.ts', makeLayoutedNode('a.ts')]]);

    const { result } = renderHook(() =>
      useReactFlowGraph({
        positionedNodes,
        cruiseSnapshot: emptyCruiseSnapshot,
        folderColors: emptyFolderColors,
        applyNodePositionToCache: vi.fn(() => positionedNodes),
        setIsDragging: vi.fn(),
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.nodes.map(node => node.id)).toEqual(['a.ts']);
  });

  it('applies reflowed geometry via onNodesChange on drag and commits on stop', async () => {
    const setIsDragging = vi.fn();
    const reflowed = new Map([
      ['a.ts', { ...makeLayoutedNode('a.ts'), position: { x: 10, y: 20 } }],
      ['b.ts', { ...makeLayoutedNode('b.ts'), position: { x: 0, y: 80 } }],
    ]);
    const applyNodePositionToCache = vi.fn(() => reflowed);
    const positionedNodes = new Map([
      ['a.ts', makeLayoutedNode('a.ts')],
      ['b.ts', makeLayoutedNode('b.ts')],
    ]);

    const { result } = renderHook(() =>
      useReactFlowGraph({
        positionedNodes,
        cruiseSnapshot: emptyCruiseSnapshot,
        folderColors: emptyFolderColors,
        applyNodePositionToCache,
        setIsDragging,
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    const draggedNode = { id: 'a.ts', position: { x: 10, y: 20 } } as Parameters<typeof result.current.onNodeDrag>[1];
    // React Flow passes only dragged items as the 3rd arg, not the full node list.
    const draggedOnly = [draggedNode] as Parameters<typeof result.current.onNodeDrag>[2];

    act(() => {
      result.current.onNodeDrag({} as never, draggedNode, draggedOnly);
    });

    expect(setIsDragging).toHaveBeenCalledWith(true);
    expect(applyNodePositionToCache).toHaveBeenCalledWith('a.ts', { x: 10, y: 20 });
    expect(result.current.nodes.find(node => node.id === 'b.ts')?.position.y).toBe(80);

    act(() => {
      result.current.onNodeDragStop({} as never, draggedNode, draggedOnly);
    });

    expect(applyNodePositionToCache).toHaveBeenCalledWith('a.ts', { x: 10, y: 20 }, { commit: true });
    expect(setIsDragging).toHaveBeenCalledWith(false);
  });
});
