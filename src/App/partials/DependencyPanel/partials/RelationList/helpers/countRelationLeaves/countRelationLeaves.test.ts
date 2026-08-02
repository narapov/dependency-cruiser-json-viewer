import { describe, expect, it } from 'vitest';

import type { ModuleRelation } from '@/domain';

import { countRelationLeaves } from './countRelationLeaves';

const leaf = (path: string): ModuleRelation => ({
  path,
  circular: false,
  typeOnly: false,
  typeOnlyCircular: false,
});

describe('countRelationLeaves', () => {
  it('counts leaf rows as one each', () => {
    expect(countRelationLeaves([leaf('a.ts'), leaf('b.ts')])).toBe(2);
  });

  it('counts nested leaves recursively', () => {
    expect(
      countRelationLeaves([
        {
          ...leaf('src'),
          children: [
            {
              ...leaf('src/foo'),
              children: [leaf('src/foo/a.ts'), leaf('src/foo/b.ts')],
            },
            leaf('src/bar.ts'),
          ],
        },
      ]),
    ).toBe(3);
  });
});
