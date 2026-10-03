import type { LibavoidRouterOptions } from '@mr_mint/elkjs-libavoid';

import { LIBAVOID_NEED_PROFILE } from '../libavoidNeedProfile';
import type { LibavoidElkGraph } from '../nodesToLibavoidGraph';

/** Shared libavoid router options for one-shot and session routing. */
export const LIBAVOID_ROUTING_OPTIONS = {
  routingType: 'orthogonal',
  shapeBufferDistance: 8,
  crossingPenalty: 0,
} as const satisfies LibavoidRouterOptions;

/** Logs the graph summary and router options passed into a libavoid API call. */
export function logLibavoidCall(
  api: 'routeEdges',
  graph: LibavoidElkGraph,
  options: LibavoidRouterOptions = LIBAVOID_ROUTING_OPTIONS,
): void {
  if (!LIBAVOID_NEED_PROFILE) {
    return;
  }

  console.log('[libavoid]', api, {
    options,
    graphId: graph.id,
    children: graph.children.length,
    edges: graph.edges.length,
    childIds: graph.children.map(child => child.id),
    edgeIds: graph.edges.map(edge => edge.id),
  });
}
