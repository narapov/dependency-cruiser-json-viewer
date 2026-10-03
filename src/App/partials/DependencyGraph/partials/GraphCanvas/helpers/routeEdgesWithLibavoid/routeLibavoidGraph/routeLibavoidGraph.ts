import { routeEdges, type LibavoidRoutingOptions, type RouteResult } from '@mr_mint/elkjs-libavoid';

import type { LibavoidElkGraph } from '../nodesToLibavoidGraph';

/** Max connectors per libavoid `processTransaction` — denser batches hang the thread. */
export const LIBAVOID_EDGE_BATCH_SIZE = 30;

function yieldToMain(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
}

/**
 * Routes a flat libavoid ELK graph, splitting dense edge sets into `edgeIds` batches.
 * Each batch still sees all node obstacles; connectors from other batches are invisible
 * (fine with `crossingPenalty: 0`). Yields between batches so the host can paint / post progress.
 */
export async function routeLibavoidGraph(
  graph: LibavoidElkGraph,
  options: LibavoidRoutingOptions = {},
): Promise<Map<string, RouteResult>> {
  const { edges } = graph;
  if (edges.length === 0) {
    return new Map();
  }

  const edgeIds = edges.map(edge => edge.id);

  if (edges.length <= LIBAVOID_EDGE_BATCH_SIZE) {
    return routeEdges(graph, options);
  }

  const result = new Map<string, RouteResult>();

  for (let offset = 0; offset < edgeIds.length; offset += LIBAVOID_EDGE_BATCH_SIZE) {
    if (offset > 0) {
      await yieldToMain();
    }
    const batchIds = edgeIds.slice(offset, offset + LIBAVOID_EDGE_BATCH_SIZE);
    const batchRoutes = await routeEdges(graph, { ...options, edgeIds: batchIds });
    batchRoutes.forEach((route, edgeId) => {
      result.set(edgeId, route);
    });
  }

  return result;
}
