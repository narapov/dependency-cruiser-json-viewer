import type { BuildGraphInput, BuildGraphResult } from '../../../types';

/** Payload sent from the main thread to the build-graph worker. */
export type BuildGraphWorkerRequest = BuildGraphInput;

/** Payload sent from the build-graph worker back to the main thread. */
export type BuildGraphWorkerResponse = { ok: true; result: BuildGraphResult } | { ok: false; message: string };
