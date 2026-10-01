import './elkDocumentShim';

import { buildGraph } from './buildGraph';
import type { BuildGraphWorkerRequest, BuildGraphWorkerResponse } from './types';

self.onmessage = (event: MessageEvent<BuildGraphWorkerRequest>) => {
  void buildGraph(event.data)
    .then(result => {
      const response: BuildGraphWorkerResponse = { ok: true, result };
      self.postMessage(response);
    })
    .catch(error => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const response: BuildGraphWorkerResponse = { ok: false, message };
      self.postMessage(response);
    });
};
