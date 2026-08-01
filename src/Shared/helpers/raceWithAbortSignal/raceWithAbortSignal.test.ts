import { describe, expect, it, vi } from 'vitest';

import { raceWithAbortSignal } from './raceWithAbortSignal';

describe('raceWithAbortSignal', () => {
  it('resolves with the promise value when it settles before abort', async () => {
    const controller = new AbortController();
    await expect(raceWithAbortSignal(Promise.resolve(42), controller.signal)).resolves.toBe(42);
  });

  it('rejects with AbortError when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(raceWithAbortSignal(Promise.resolve(42), controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });

  it('rejects when the signal aborts before the promise settles', async () => {
    const controller = new AbortController();
    const { promise: pending } = Promise.withResolvers<number>();

    const raced = raceWithAbortSignal(pending, controller.signal);
    controller.abort();

    await expect(raced).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('removes the abort listener after the promise settles', async () => {
    const controller = new AbortController();
    const removeEventListener = vi.spyOn(controller.signal, 'removeEventListener');

    await raceWithAbortSignal(Promise.resolve('ok'), controller.signal);
    await Promise.resolve();

    expect(removeEventListener).toHaveBeenCalledWith('abort', expect.any(Function));
  });

  it('rejects with a custom abort reason', async () => {
    const controller = new AbortController();
    const reason = new Error('cancelled');
    const { promise: pending } = Promise.withResolvers<number>();

    const raced = raceWithAbortSignal(pending, controller.signal);
    controller.abort(reason);

    await expect(raced).rejects.toBe(reason);
  });
});
