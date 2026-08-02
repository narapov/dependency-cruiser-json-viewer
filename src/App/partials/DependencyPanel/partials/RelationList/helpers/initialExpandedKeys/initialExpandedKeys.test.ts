import { describe, expect, it } from 'vitest';

import type { ModuleRelation } from '@/domain';

import { initialExpandedKeys } from './initialExpandedKeys';

const leaf = (path: string): ModuleRelation => ({
  path,
  circular: false,
  typeOnly: false,
  typeOnlyCircular: false,
});

const nested: ModuleRelation[] = [
  {
    ...leaf('src'),
    children: [
      {
        ...leaf('src/foo'),
        children: [leaf('src/foo/a.ts')],
      },
    ],
  },
];

describe('initialExpandedKeys', () => {
  it('returns an empty set for leaf-only items', () => {
    expect(initialExpandedKeys([leaf('a.ts')], '')).toEqual(new Set());
  });

  it('collects group keys with an empty prefix', () => {
    expect(initialExpandedKeys(nested, '')).toEqual(new Set(['src', 'src/foo']));
  });

  it('applies a hidden: prefix to every group key', () => {
    expect(initialExpandedKeys(nested, 'hidden:')).toEqual(new Set(['hidden:src', 'hidden:src/foo']));
  });
});
