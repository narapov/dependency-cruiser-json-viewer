import type { AvoidRoute, ThinRoutingEdge, VisibleTreeLayoutedNode } from '../../types';
import {
  toRouteEdgesWorkerRequest,
  type LibavoidRoutingProgress,
  type RouteEdgesWorkerResponse,
  type RoutingNodeGeometry,
} from './types';

export interface RouteEdgesWorkerSession {
  promise: Promise<Map<string, AvoidRoute>>;
  terminate: () => void;
}

/** Runs libavoid routing in a dedicated worker with progress callbacks and hard cancellation. */
export function runRouteEdgesInWorker(input: {
  tree: readonly VisibleTreeLayoutedNode[];
  edges: readonly ThinRoutingEdge[];
  geometryByPath?: ReadonlyMap<string, RoutingNodeGeometry>;
  onProgress?: (progress: LibavoidRoutingProgress) => void;
}): RouteEdgesWorkerSession {
  // URL worker: avoids evaluating the worker graph (and libavoid WASM) when this module is imported.
  const worker = new Worker(new URL('./routeEdges.worker.ts', import.meta.url), { type: 'module' });
  let cancelled = false;

  const promise = new Promise<Map<string, AvoidRoute>>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<RouteEdgesWorkerResponse>) => {
      if (cancelled) {
        return;
      }

      const response = event.data;
      if (!response.ok) {
        reject(new Error(response.message));
        return;
      }

      if (response.type === 'progress') {
        input.onProgress?.(response.progress);
        return;
      }

      resolve(new Map(response.routes));
    };

    worker.onerror = event => {
      if (cancelled) {
        return;
      }

      const detail = event.message || 'Libavoid worker failed';
      reject(new Error(detail));
    };

    worker.postMessage(
      toRouteEdgesWorkerRequest({
        tree: input.tree,
        edges: input.edges,
        geometryByPath: input.geometryByPath,
      }),
    );
  });

  const terminate = () => {
    cancelled = true;
    worker.terminate();
  };

  return { promise, terminate };
}
