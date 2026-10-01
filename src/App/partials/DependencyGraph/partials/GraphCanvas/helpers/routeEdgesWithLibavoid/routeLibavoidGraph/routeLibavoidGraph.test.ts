import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RouteResult } from '@mr_mint/elkjs-libavoid';

import type { LibavoidElkGraph } from '../nodesToLibavoidGraph';
import { LIBAVOID_EDGE_BATCH_SIZE, routeLibavoidGraph } from './routeLibavoidGraph';

vi.mock('@mr_mint/elkjs-libavoid', () => ({
  routeEdges: vi.fn(),
}));

const { routeEdges } = await import('@mr_mint/elkjs-libavoid');

function makeRoute(): RouteResult {
  return {
    sourcePoint: { x: 0, y: 0 },
    targetPoint: { x: 10, y: 10 },
    bendPoints: [],
    sourceSide: 'east',
    targetSide: 'west',
  };
}

function makeGraph(edgeCount: number): LibavoidElkGraph {
  return {
    id: 'root',
    children: [
      { id: 'a', x: 0, y: 0, width: 40, height: 20 },
      { id: 'b', x: 100, y: 0, width: 40, height: 20 },
    ],
    edges: Array.from({ length: edgeCount }, (_, index) => ({
      id: `e${index}`,
      source: 'a',
      target: 'b',
      sourcePort: 'a:E0',
      targetPort: 'b:W0',
    })),
  };
}

describe('routeLibavoidGraph', () => {
  beforeEach(() => {
    vi.mocked(routeEdges).mockReset();
    vi.mocked(routeEdges).mockImplementation(async (_graph, options) => {
      const ids = options?.edgeIds ?? [];
      const result = new Map<string, RouteResult>();
      ids.forEach(id => {
        result.set(id, makeRoute());
      });
      if (ids.length === 0) {
        // single-call path with no edgeIds filter — return all from graph size via mock graph
        return result;
      }
      return result;
    });
  });

  it('calls routeEdges once when edge count is within the batch size', async () => {
    const graph = makeGraph(LIBAVOID_EDGE_BATCH_SIZE);
    vi.mocked(routeEdges).mockResolvedValueOnce(new Map(graph.edges.map(edge => [edge.id, makeRoute()])));

    const routes = await routeLibavoidGraph(graph, { routingType: 'orthogonal' });

    expect(routeEdges).toHaveBeenCalledTimes(1);
    expect(routeEdges).toHaveBeenCalledWith(graph, { routingType: 'orthogonal' });
    expect(routes.size).toBe(LIBAVOID_EDGE_BATCH_SIZE);
  });

  it('batches edgeIds when the graph is denser than the batch size', async () => {
    const edgeCount = LIBAVOID_EDGE_BATCH_SIZE * 2 + 5;
    const graph = makeGraph(edgeCount);
    vi.mocked(routeEdges).mockImplementation(async (_graph, options) => {
      const result = new Map<string, RouteResult>();
      (options?.edgeIds ?? []).forEach(id => {
        result.set(id, makeRoute());
      });
      return result;
    });

    const routes = await routeLibavoidGraph(graph, { routingType: 'orthogonal', shapeBufferDistance: 8 });

    expect(routeEdges).toHaveBeenCalledTimes(3);
    expect(vi.mocked(routeEdges).mock.calls[0]?.[1]?.edgeIds).toEqual(
      Array.from({ length: LIBAVOID_EDGE_BATCH_SIZE }, (_, i) => `e${i}`),
    );
    expect(vi.mocked(routeEdges).mock.calls[1]?.[1]?.edgeIds).toEqual(
      Array.from({ length: LIBAVOID_EDGE_BATCH_SIZE }, (_, i) => `e${i + LIBAVOID_EDGE_BATCH_SIZE}`),
    );
    expect(vi.mocked(routeEdges).mock.calls[2]?.[1]?.edgeIds).toEqual(
      Array.from({ length: 5 }, (_, i) => `e${i + LIBAVOID_EDGE_BATCH_SIZE * 2}`),
    );
    expect(vi.mocked(routeEdges).mock.calls[0]?.[1]).toMatchObject({
      routingType: 'orthogonal',
      shapeBufferDistance: 8,
    });
    expect(routes.size).toBe(edgeCount);
    expect(routes.has('e0')).toBe(true);
    expect(routes.has(`e${edgeCount - 1}`)).toBe(true);
  });

  it('returns an empty map for a graph with no edges', async () => {
    const routes = await routeLibavoidGraph(makeGraph(0));

    expect(routeEdges).not.toHaveBeenCalled();
    expect(routes.size).toBe(0);
  });
});
