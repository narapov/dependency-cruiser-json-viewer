// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

import { renderHook, waitFor } from '@testing-library/react';

import type { RoutableEdge, VisibleTreeLayoutedNode } from '../../types';
import { useLibavoidEdgeRouting } from './useLibavoidEdgeRouting';

const { runRouteEdgesInWorker } = vi.hoisted(() => {
  const terminateFn = vi.fn();
  return {
    runRouteEdgesInWorker: vi.fn(() => ({
      promise: Promise.resolve(
        new Map([
          [
            'a->b',
            {
              sourcePoint: { x: 0, y: 0 },
              targetPoint: { x: 10, y: 0 },
              bendPoints: [],
            },
          ],
        ]),
      ),
      terminate: terminateFn,
    })),
  };
});

vi.mock('../../helpers/routeEdgesWorker', () => ({
  runRouteEdgesInWorker,
}));

const layoutedTree: VisibleTreeLayoutedNode[] = [
  {
    path: 'a',
    ancestors: [],
    descendants: [],
    valueCircular: false,
    typeOnlyCircular: false,
    position: { x: 0, y: 0 },
    width: 40,
    height: 20,
  },
  {
    path: 'b',
    ancestors: [],
    descendants: [],
    valueCircular: false,
    typeOnlyCircular: false,
    position: { x: 100, y: 0 },
    width: 40,
    height: 20,
  },
];

const positionedNodes = new Map<string, VisibleTreeLayoutedNode>([
  ['a', layoutedTree[0]!],
  ['b', layoutedTree[1]!],
]);
const edges: RoutableEdge[] = [{ id: 'a->b', source: 'a', target: 'b' }];

describe('useLibavoidEdgeRouting', () => {
  it('schedules worker routing for libavoidOrthogonal and applies routes', async () => {
    runRouteEdgesInWorker.mockClear();

    const { result } = renderHook(() =>
      useLibavoidEdgeRouting({
        edgesType: 'libavoidOrthogonal',
        layoutedTree,
        positionedNodes,
        edges,
        isDragging: false,
      }),
    );

    await waitFor(() => {
      expect(runRouteEdgesInWorker).toHaveBeenCalled();
      expect(result.current.routedEdges[0]).toMatchObject({
        avoidPath: expect.any(String),
      });
    });

    expect(runRouteEdgesInWorker).toHaveBeenCalledWith(
      expect.objectContaining({
        tree: expect.any(Array),
        edges: [expect.objectContaining({ id: 'a->b' })],
        geometryByPath: expect.any(Map),
      }),
    );
    expect(runRouteEdgesInWorker).toHaveBeenCalledWith(
      expect.not.objectContaining({
        nodes: expect.anything(),
        parentByNode: expect.anything(),
      }),
    );
  });

  it('skips routing while dragging', () => {
    runRouteEdgesInWorker.mockClear();

    renderHook(() =>
      useLibavoidEdgeRouting({
        edgesType: 'libavoidOrthogonal',
        layoutedTree,
        positionedNodes,
        edges,
        isDragging: true,
      }),
    );

    expect(runRouteEdgesInWorker).not.toHaveBeenCalled();
  });

  it('passes live geometry overlay for the worker boundary projection', async () => {
    runRouteEdgesInWorker.mockClear();

    const draggedPositionedNodes = new Map<string, VisibleTreeLayoutedNode>([
      [
        'a',
        {
          ...layoutedTree[0]!,
          position: { x: 15, y: 25 },
        },
      ],
      ['b', layoutedTree[1]!],
    ]);

    renderHook(() =>
      useLibavoidEdgeRouting({
        edgesType: 'libavoidOrthogonal',
        layoutedTree,
        positionedNodes: draggedPositionedNodes,
        edges,
        isDragging: false,
      }),
    );

    await waitFor(() => {
      expect(runRouteEdgesInWorker).toHaveBeenCalled();
    });

    expect(runRouteEdgesInWorker).toHaveBeenCalledWith(
      expect.objectContaining({
        tree: layoutedTree,
        geometryByPath: expect.any(Map),
      }),
    );
    const [[firstCall]] = runRouteEdgesInWorker.mock.calls as unknown as [
      [{ geometryByPath: Map<string, { position: { x: number; y: number } }> }],
    ];
    expect(firstCall.geometryByPath.get('a')?.position).toEqual({ x: 15, y: 25 });
  });
});
