import { describe, expect, it } from 'vitest';

import type { ModuleRelation } from '../../../types';
import { buildRelationPathTree } from './buildRelationPathTree';

const leaf = (path: string, flags: Partial<ModuleRelation> = {}): ModuleRelation => ({
  path,
  circular: false,
  typeOnly: false,
  typeOnlyCircular: false,
  ...flags,
});

describe('buildRelationPathTree', () => {
  it('returns an empty list for no leaves', () => {
    expect(buildRelationPathTree([])).toEqual([]);
  });

  it('nests shared path prefixes into a folder tree', () => {
    expect(buildRelationPathTree([leaf('src/App/a.ts'), leaf('src/App/hooks/x.ts'), leaf('src/domain/y.ts')])).toEqual([
      {
        path: 'src',
        circular: false,
        typeOnly: false,
        typeOnlyCircular: false,
        children: [
          {
            path: 'src/App',
            circular: false,
            typeOnly: false,
            typeOnlyCircular: false,
            children: [
              {
                path: 'src/App/hooks',
                circular: false,
                typeOnly: false,
                typeOnlyCircular: false,
                children: [{ path: 'src/App/hooks/x.ts', circular: false, typeOnly: false, typeOnlyCircular: false }],
              },
              { path: 'src/App/a.ts', circular: false, typeOnly: false, typeOnlyCircular: false },
            ],
          },
          {
            path: 'src/domain',
            circular: false,
            typeOnly: false,
            typeOnlyCircular: false,
            children: [{ path: 'src/domain/y.ts', circular: false, typeOnly: false, typeOnlyCircular: false }],
          },
        ],
      },
    ]);
  });

  it('rolls circular flags up to ancestors', () => {
    const tree = buildRelationPathTree([leaf('src/foo/a.ts', { circular: true }), leaf('src/foo/b.ts')]);

    expect(tree[0].circular).toBe(true);
    expect(tree[0].children![0].circular).toBe(true);
    expect(tree[0].children![0].children!.find(c => c.path === 'src/foo/a.ts')!.circular).toBe(true);
    expect(tree[0].children![0].children!.find(c => c.path === 'src/foo/b.ts')!.circular).toBe(false);
  });

  it('sorts folders before files at the same level', () => {
    const tree = buildRelationPathTree([leaf('src/z.ts'), leaf('src/a/b.ts')]);

    expect(tree[0].children!.map(c => c.path)).toEqual(['src/a', 'src/z.ts']);
  });
});
