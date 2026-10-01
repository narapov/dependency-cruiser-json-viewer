/** Force elk-worker FakeWorker export when running inside a Web Worker (same as buildGraph). */
if (typeof globalThis.document === 'undefined') {
  (globalThis as { document?: unknown }).document = globalThis;
}
