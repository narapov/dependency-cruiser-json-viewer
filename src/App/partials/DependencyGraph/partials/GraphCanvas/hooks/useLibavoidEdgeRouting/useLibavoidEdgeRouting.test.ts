// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

import { renderHook, waitFor } from '@testing-library/react';
import type { Edge, Node } from '@xyflow/react';

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

const nodes: Node[] = [
  { id: 'a', position: { x: 0, y: 0 }, data: {}, width: 40, height: 20 },
  { id: 'b', position: { x: 100, y: 0 }, data: {}, width: 40, height: 20 },
];
const edges: Edge[] = [{ id: 'a->b', source: 'a', target: 'b' }];
const parentByNode = new Map<string, string | null>([
  ['a', null],
  ['b', null],
]);

describe('useLibavoidEdgeRouting', () => {
  it('schedules worker routing for libavoidOrthogonal and applies routes', async () => {
    const { result } = renderHook(() =>
      useLibavoidEdgeRouting({
        edgesType: 'libavoidOrthogonal',
        nodes,
        edges,
        parentByNode,
        isDragging: false,
      }),
    );

    await waitFor(() => {
      expect(runRouteEdgesInWorker).toHaveBeenCalled();
      expect(result.current.routedEdges[0]?.data).toMatchObject({
        avoidPath: expect.any(String),
      });
    });
  });

  it('skips routing while dragging', () => {
    runRouteEdgesInWorker.mockClear();

    renderHook(() =>
      useLibavoidEdgeRouting({
        edgesType: 'libavoidOrthogonal',
        nodes,
        edges,
        parentByNode,
        isDragging: true,
      }),
    );

    expect(runRouteEdgesInWorker).not.toHaveBeenCalled();
  });
});
