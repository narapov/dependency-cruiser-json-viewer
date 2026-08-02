import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { makeDependencyKey } from '@/domain';

import { getPanelRelationDependencyKeys } from './getPanelRelationDependencyKeys';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

describe('getPanelRelationDependencyKeys', () => {
  it('returns a single key for a file panel dependency', () => {
    const modules = [moduleAt('src/a.ts', [{ resolved: 'src/b.ts' } as IModule['dependencies'][0]])];

    expect(getPanelRelationDependencyKeys('src/a.ts', 'src/b.ts', 'dependencies', modules)).toEqual([
      makeDependencyKey('src/a.ts', 'src/b.ts'),
    ]);
  });

  it('returns a single key for a file panel dependent', () => {
    const modules = [moduleAt('src/b.ts', [{ resolved: 'src/a.ts' } as IModule['dependencies'][0]])];

    expect(getPanelRelationDependencyKeys('src/a.ts', 'src/b.ts', 'dependents', modules)).toEqual([
      makeDependencyKey('src/b.ts', 'src/a.ts'),
    ]);
  });

  it('collects all under-folder deps for a folder panel dependency', () => {
    const modules = [
      moduleAt('src/foo/a.ts', [{ resolved: 'src/bar/c.ts' } as IModule['dependencies'][0]]),
      moduleAt('src/foo/b.ts', [{ resolved: 'src/bar/c.ts' } as IModule['dependencies'][0]]),
      moduleAt('src/other/x.ts', [{ resolved: 'src/bar/c.ts' } as IModule['dependencies'][0]]),
    ];

    expect(getPanelRelationDependencyKeys('src/foo', 'src/bar/c.ts', 'dependencies', modules)).toEqual([
      makeDependencyKey('src/foo/a.ts', 'src/bar/c.ts'),
      makeDependencyKey('src/foo/b.ts', 'src/bar/c.ts'),
    ]);
  });

  it('collects all under-folder targets for a folder panel dependent', () => {
    const modules = [
      moduleAt('src/bar/c.ts', [
        { resolved: 'src/foo/a.ts' } as IModule['dependencies'][0],
        { resolved: 'src/foo/b.ts' } as IModule['dependencies'][0],
        { resolved: 'src/other/x.ts' } as IModule['dependencies'][0],
      ]),
    ];

    expect(getPanelRelationDependencyKeys('src/foo', 'src/bar/c.ts', 'dependents', modules)).toEqual([
      makeDependencyKey('src/bar/c.ts', 'src/foo/a.ts'),
      makeDependencyKey('src/bar/c.ts', 'src/foo/b.ts'),
    ]);
  });
});
