import { init } from '@mr_mint/elkjs-libavoid';

let initPromise: Promise<void> | null = null;

/** Initializes libavoid once with the Vite base-aware WASM URL. */
export function ensureLibavoidInit(): Promise<void> {
  if (!initPromise) {
    initPromise = init(`${import.meta.env.BASE_URL}libavoid.wasm`);
  }

  return initPromise;
}
