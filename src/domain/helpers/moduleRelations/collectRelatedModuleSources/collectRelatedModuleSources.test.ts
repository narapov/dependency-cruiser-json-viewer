import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { collectRelatedModuleSources } from './collectRelatedModuleSources';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

describe('collectRelatedModuleSources', () => {
  const modules = [
    moduleAt('src/foo/a.ts', [
      { resolved: 'src/foo/b.ts' } as IModule['dependencies'][0],
      { resolved: 'src/bar/c.ts' } as IModule['dependencies'][0],
    ]),
    moduleAt('src/foo/b.ts', [{ resolved: 'src/foo/a.ts' } as IModule['dependencies'][0]]),
    moduleAt('src/bar/c.ts'),
    moduleAt('lib/y.ts', [{ resolved: 'src/foo/a.ts' } as IModule['dependencies'][0]]),
  ];

  it('collects file dependencies as flat module sources', () => {
    expect(collectRelatedModuleSources('src/foo/a.ts', modules, 'dependencies').sort()).toEqual([
      'src/bar/c.ts',
      'src/foo/b.ts',
    ]);
  });

  it('collects file dependents as flat module sources', () => {
    expect(collectRelatedModuleSources('src/foo/a.ts', modules, 'dependents').sort()).toEqual([
      'lib/y.ts',
      'src/foo/b.ts',
    ]);
  });

  it('collects folder dependencies that cross the folder boundary', () => {
    expect(collectRelatedModuleSources('src/foo', modules, 'dependencies')).toEqual(['src/bar/c.ts']);
  });

  it('collects folder dependents that cross the folder boundary', () => {
    expect(collectRelatedModuleSources('src/foo', modules, 'dependents')).toEqual(['lib/y.ts']);
  });

  it('returns an empty list for an unknown path', () => {
    expect(collectRelatedModuleSources('missing', modules, 'dependencies')).toEqual([]);
    expect(collectRelatedModuleSources('missing', modules, 'dependents')).toEqual([]);
  });

  it('ignores unresolved dependency targets', () => {
    const withUnresolved = [
      moduleAt('src/a.ts', [
        { resolved: undefined } as unknown as IModule['dependencies'][0],
        { resolved: 'src/b.ts' } as IModule['dependencies'][0],
      ]),
      moduleAt('src/b.ts'),
    ];

    expect(collectRelatedModuleSources('src/a.ts', withUnresolved, 'dependencies')).toEqual(['src/b.ts']);
  });
});
