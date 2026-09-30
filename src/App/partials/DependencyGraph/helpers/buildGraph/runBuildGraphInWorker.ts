import type { BuildGraphInput, BuildGraphResult } from '../../types';
import BuildGraphWorker from './buildGraph.worker?worker';
import type { BuildGraphWorkerRequest, BuildGraphWorkerResponse } from './types';

export interface BuildGraphWorkerSession {
  promise: Promise<BuildGraphResult>;
  terminate: () => void;
}

/** Runs `buildGraph` in a dedicated worker and exposes hard cancellation via `terminate()`. */
export function runBuildGraphInWorker(input: BuildGraphInput): BuildGraphWorkerSession {
  const worker = new BuildGraphWorker();
  let cancelled = false;

  const promise = new Promise<BuildGraphResult>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<BuildGraphWorkerResponse>) => {
      if (cancelled) {
        return;
      }

      const response = event.data;
      if (response.ok) {
        resolve(response.result);
        return;
      }

      reject(new Error(response.message));
    };

    worker.onerror = () => {
      if (cancelled) {
        return;
      }

      reject(new Error('Worker failed'));
    };

    worker.postMessage(input satisfies BuildGraphWorkerRequest);
  });

  const terminate = () => {
    cancelled = true;
    worker.terminate();
  };

  return { promise, terminate };
}
