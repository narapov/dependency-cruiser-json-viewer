import { describe, expect, it } from 'vitest';

import type { PositionCache } from '../types';
import { deserializePositionCache, serializePositionCache } from './serializePositionCache';

describe('serializePositionCache / deserializePositionCache', () => {
  it('round-trips root null group as empty string key', () => {
    const cache: PositionCache = new Map([
      [null, new Map([['src/a.ts', { x: 1, y: 2 }]])],
      ['src', new Map([['src/b.ts', { x: 3, y: 4 }]])],
    ]);

    const serialized = serializePositionCache(cache);
    expect(serialized).toEqual({
      '': { 'src/a.ts': { x: 1, y: 2 } },
      src: { 'src/b.ts': { x: 3, y: 4 } },
    });

    const restored = deserializePositionCache(serialized);
    expect(restored.get(null)?.get('src/a.ts')).toEqual({ x: 1, y: 2 });
    expect(restored.get('src')?.get('src/b.ts')).toEqual({ x: 3, y: 4 });
    expect(restored.has('' as never)).toBe(false);
  });
});
