/** Force elk-worker FakeWorker export when running inside a Web Worker. */
if (typeof globalThis.document === 'undefined') {
  (globalThis as { document?: unknown }).document = globalThis;
}
