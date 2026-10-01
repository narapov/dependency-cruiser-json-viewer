import { describe, expect, it } from 'vitest';

import type { LayoutCache } from '../types';
import { deserializeLayoutCache, serializeLayoutCache } from './serializeLayoutCache';

describe('serializeLayoutCache / deserializeLayoutCache', () => {
  it('round-trips root null group as empty string key with sizes', () => {
    const cache: LayoutCache = new Map([
      [
        null,
        {
          id: null,
          width: 400,
          height: 300,
          children: new Map([['src', { id: 'src', position: { x: 10, y: 20 }, width: 100, height: 50 }]]),
        },
      ],
      [
        'src',
        {
          id: 'src',
          width: 200,
          height: 150,
          children: new Map([['src/a.ts', { id: 'src/a.ts', position: { x: 16, y: 52 }, width: 80, height: 32 }]]),
        },
      ],
    ]);

    const serialized = serializeLayoutCache(cache);
    expect(serialized).toEqual({
      '': {
        id: '',
        width: 400,
        height: 300,
        children: {
          src: { id: 'src', position: { x: 10, y: 20 }, width: 100, height: 50 },
        },
      },
      src: {
        id: 'src',
        width: 200,
        height: 150,
        children: {
          'src/a.ts': { id: 'src/a.ts', position: { x: 16, y: 52 }, width: 80, height: 32 },
        },
      },
    });

    const restored = deserializeLayoutCache(serialized);
    expect(restored.get(null)?.children.get('src')).toEqual({
      id: 'src',
      position: { x: 10, y: 20 },
      width: 100,
      height: 50,
    });
    expect(restored.get('src')?.width).toBe(200);
    expect(restored.has('' as never)).toBe(false);
  });

  it('defaults missing sizes to 0 when deserializing legacy-like entries', () => {
    const restored = deserializeLayoutCache({
      '': {
        id: '',
        children: {
          'src/a.ts': { id: 'src/a.ts', position: { x: 1, y: 2 } },
        },
      },
    });

    expect(restored.get(null)).toEqual({
      id: null,
      width: 0,
      height: 0,
      children: new Map([['src/a.ts', { id: 'src/a.ts', position: { x: 1, y: 2 }, width: 0, height: 0 }]]),
    });
  });
});
