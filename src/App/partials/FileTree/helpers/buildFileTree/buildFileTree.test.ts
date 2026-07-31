import { describe, expect, it } from 'vitest';

import { buildFileTree } from './buildFileTree';

describe('buildFileTree', () => {
  it('returns empty tree for empty sources', () => {
    expect(buildFileTree([])).toEqual([]);
  });

  it('builds nested folders with folders before files', () => {
    expect(buildFileTree(['src/b.ts', 'src/a/index.ts', 'lib/c.ts'])).toEqual([
      {
        key: 'lib',
        title: 'lib',
        children: [{ key: 'lib/c.ts', title: 'c.ts' }],
      },
      {
        key: 'src',
        title: 'src',
        children: [
          {
            key: 'src/a',
            title: 'a',
            children: [{ key: 'src/a/index.ts', title: 'index.ts' }],
          },
          { key: 'src/b.ts', title: 'b.ts' },
        ],
      },
    ]);
  });

  it('sorts sibling names alphabetically', () => {
    expect(buildFileTree(['z.ts', 'a.ts'])).toEqual([
      { key: 'a.ts', title: 'a.ts' },
      { key: 'z.ts', title: 'z.ts' },
    ]);
  });
});
