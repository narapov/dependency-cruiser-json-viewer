/** Dev-only profiling flag for libavoid (kept local so the worker never imports `@/Shared` / React). */
export const LIBAVOID_NEED_PROFILE = import.meta.env.DEV && import.meta.env.MODE !== 'test';
