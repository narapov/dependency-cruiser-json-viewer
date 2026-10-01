import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { buildCruiseSnapshot } from '../../cruiseSnapshot';
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

  const snapshot = buildCruiseSnapshot(modules);

  it('collects file dependencies as flat module sources', () => {
    expect(collectRelatedModuleSources(snapshot, 'src/foo/a.ts', 'dependencies').sort()).toEqual([
      'src/bar/c.ts',
      'src/foo/b.ts',
    ]);
  });

  it('collects file dependents as flat module sources', () => {
    expect(collectRelatedModuleSources(snapshot, 'src/foo/a.ts', 'dependents').sort()).toEqual([
      'lib/y.ts',
      'src/foo/b.ts',
    ]);
  });

  it('collects folder dependencies that cross the folder boundary', () => {
    expect(collectRelatedModuleSources(snapshot, 'src/foo', 'dependencies')).toEqual(['src/bar/c.ts']);
  });

  it('collects folder dependents that cross the folder boundary', () => {
    expect(collectRelatedModuleSources(snapshot, 'src/foo', 'dependents')).toEqual(['lib/y.ts']);
  });

  it('returns an empty list for an unknown path', () => {
    expect(collectRelatedModuleSources(snapshot, 'missing', 'dependencies')).toEqual([]);
    expect(collectRelatedModuleSources(snapshot, 'missing', 'dependents')).toEqual([]);
  });

  it('ignores unresolved dependency targets', () => {
    const withUnresolved = buildCruiseSnapshot([
      moduleAt('src/a.ts', [
        { resolved: undefined } as unknown as IModule['dependencies'][0],
        { resolved: 'src/b.ts' } as IModule['dependencies'][0],
      ]),
      moduleAt('src/b.ts'),
    ]);

    expect(collectRelatedModuleSources(withUnresolved, 'src/a.ts', 'dependencies')).toEqual(['src/b.ts']);
  });
});
