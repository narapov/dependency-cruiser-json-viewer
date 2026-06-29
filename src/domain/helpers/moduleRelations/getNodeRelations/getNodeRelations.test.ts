import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { getNodeRelations } from './getNodeRelations';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

describe('getNodeRelations', () => {
  const modules = [
    moduleAt('src/foo/a.ts', [{ resolved: 'src/bar/c.ts' } as IModule['dependencies'][0]]),
    moduleAt('src/bar/c.ts'),
  ];

  it('uses module relations for files', () => {
    const relations = getNodeRelations('src/foo/a.ts', modules, ['src/foo/a.ts', 'src/bar/c.ts'], new Set());

    expect(relations.dependencies).toEqual([
      { path: 'src/bar/c.ts', circular: false, typeOnly: false, typeOnlyCircular: false },
    ]);
  });

  it('uses folder relations for folders', () => {
    const relations = getNodeRelations('src/foo', modules, ['src/foo', 'src/foo/a.ts', 'src/bar/c.ts'], new Set());

    expect(relations.dependencies).toEqual([
      { path: 'src/bar/c.ts', circular: false, typeOnly: false, typeOnlyCircular: false },
    ]);
  });
});
