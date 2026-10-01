// @vitest-environment jsdom
// @vitest-environment jsdom

import { renderHook, waitFor } from '@testing-library/react';
import type { Edge, Node } from '@xyflow/react';

import { useLibavoidEdgeRouting } from './useLibavoidEdgeRouting';

const terminate = vi.fn();

vi.mock('../../helpers', async () => {
  const actual = await vi.importActual<typeof import('../../helpers')>('../../helpers');
  return {
    ...actual,
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
      terminate,
    })),
  };
});

const { runRouteEdgesInWorker } = await import('../../helpers');

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
    vi.mocked(runRouteEdgesInWorker).mockClear();

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
