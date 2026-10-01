import './elkDocumentShim';

import { routeEdgesWithLibavoid } from './routeEdgesWithLibavoid';
import { fromRouteEdgesWorkerRequest, type RouteEdgesWorkerRequest, type RouteEdgesWorkerResponse } from './types';

self.onmessage = (event: MessageEvent<RouteEdgesWorkerRequest>) => {
  const request = event.data;

  void routeEdgesWithLibavoid({
    ...fromRouteEdgesWorkerRequest(request),
    onProgress: progress => {
      const response: RouteEdgesWorkerResponse = { ok: true, type: 'progress', progress };
      self.postMessage(response);
    },
  })
    .then(routes => {
      const response: RouteEdgesWorkerResponse = {
        ok: true,
        type: 'result',
        routes: [...routes.entries()],
      };
      self.postMessage(response);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Libavoid worker failed';
      const response: RouteEdgesWorkerResponse = { ok: false, message };
      self.postMessage(response);
    });
};
