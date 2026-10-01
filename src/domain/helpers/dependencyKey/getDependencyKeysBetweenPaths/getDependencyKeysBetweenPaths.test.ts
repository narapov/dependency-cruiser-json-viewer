import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { buildCruiseSnapshot } from '../../cruiseSnapshot';
import { makeDependencyKey } from '../makeDependencyKey';
import { getDependencyKeysBetweenPaths } from './getDependencyKeysBetweenPaths';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

describe('getDependencyKeysBetweenPaths', () => {
  it('returns a single key for a file source dependency', () => {
    const snapshot = buildCruiseSnapshot([
      moduleAt('src/a.ts', [{ resolved: 'src/b.ts' } as IModule['dependencies'][0]]),
      moduleAt('src/b.ts'),
    ]);

    expect(getDependencyKeysBetweenPaths(snapshot, 'src/a.ts', 'src/b.ts', 'dependencies')).toEqual([
      makeDependencyKey('src/a.ts', 'src/b.ts'),
    ]);
  });

  it('returns a single key for a file source dependent', () => {
    const snapshot = buildCruiseSnapshot([
      moduleAt('src/b.ts', [{ resolved: 'src/a.ts' } as IModule['dependencies'][0]]),
      moduleAt('src/a.ts'),
    ]);

    expect(getDependencyKeysBetweenPaths(snapshot, 'src/a.ts', 'src/b.ts', 'dependents')).toEqual([
      makeDependencyKey('src/b.ts', 'src/a.ts'),
    ]);
  });

  it('collects all under-folder deps for a folder source dependency', () => {
    const snapshot = buildCruiseSnapshot([
      moduleAt('src/foo/a.ts', [{ resolved: 'src/bar/c.ts' } as IModule['dependencies'][0]]),
      moduleAt('src/foo/b.ts', [{ resolved: 'src/bar/c.ts' } as IModule['dependencies'][0]]),
      moduleAt('src/other/x.ts', [{ resolved: 'src/bar/c.ts' } as IModule['dependencies'][0]]),
      moduleAt('src/bar/c.ts'),
    ]);

    expect(getDependencyKeysBetweenPaths(snapshot, 'src/foo', 'src/bar/c.ts', 'dependencies').sort()).toEqual(
      [makeDependencyKey('src/foo/a.ts', 'src/bar/c.ts'), makeDependencyKey('src/foo/b.ts', 'src/bar/c.ts')].sort(),
    );
  });

  it('collects all under-folder targets for a folder source dependent', () => {
    const snapshot = buildCruiseSnapshot([
      moduleAt('src/bar/c.ts', [
        { resolved: 'src/foo/a.ts' } as IModule['dependencies'][0],
        { resolved: 'src/foo/b.ts' } as IModule['dependencies'][0],
        { resolved: 'src/other/x.ts' } as IModule['dependencies'][0],
      ]),
      moduleAt('src/foo/a.ts'),
      moduleAt('src/foo/b.ts'),
      moduleAt('src/other/x.ts'),
    ]);

    expect(getDependencyKeysBetweenPaths(snapshot, 'src/foo', 'src/bar/c.ts', 'dependents').sort()).toEqual(
      [makeDependencyKey('src/bar/c.ts', 'src/foo/a.ts'), makeDependencyKey('src/bar/c.ts', 'src/foo/b.ts')].sort(),
    );
  });

  it('collects deps under a folder target for a file source', () => {
    const snapshot = buildCruiseSnapshot([
      moduleAt('src/a.ts', [
        { resolved: 'src/foo/b.ts' } as IModule['dependencies'][0],
        { resolved: 'src/foo/c.ts' } as IModule['dependencies'][0],
        { resolved: 'src/bar/d.ts' } as IModule['dependencies'][0],
      ]),
      moduleAt('src/foo/b.ts'),
      moduleAt('src/foo/c.ts'),
      moduleAt('src/bar/d.ts'),
    ]);

    expect(getDependencyKeysBetweenPaths(snapshot, 'src/a.ts', 'src/foo', 'dependencies').sort()).toEqual(
      [makeDependencyKey('src/a.ts', 'src/foo/b.ts'), makeDependencyKey('src/a.ts', 'src/foo/c.ts')].sort(),
    );
  });

  it('collects deps between a folder source and a folder target', () => {
    const snapshot = buildCruiseSnapshot([
      moduleAt('src/foo/a.ts', [
        { resolved: 'src/bar/c.ts' } as IModule['dependencies'][0],
        { resolved: 'src/other/x.ts' } as IModule['dependencies'][0],
      ]),
      moduleAt('src/foo/b.ts', [{ resolved: 'src/bar/d.ts' } as IModule['dependencies'][0]]),
      moduleAt('src/bar/c.ts'),
      moduleAt('src/bar/d.ts'),
      moduleAt('src/other/x.ts'),
    ]);

    expect(getDependencyKeysBetweenPaths(snapshot, 'src/foo', 'src/bar', 'dependencies').sort()).toEqual(
      [makeDependencyKey('src/foo/a.ts', 'src/bar/c.ts'), makeDependencyKey('src/foo/b.ts', 'src/bar/d.ts')].sort(),
    );
  });

  it('collects dependents under a folder relation for a file panel', () => {
    const snapshot = buildCruiseSnapshot([
      moduleAt('src/foo/a.ts', [{ resolved: 'src/panel.ts' } as IModule['dependencies'][0]]),
      moduleAt('src/foo/b.ts', [{ resolved: 'src/panel.ts' } as IModule['dependencies'][0]]),
      moduleAt('src/other/x.ts', [{ resolved: 'src/panel.ts' } as IModule['dependencies'][0]]),
      moduleAt('src/panel.ts'),
    ]);

    expect(getDependencyKeysBetweenPaths(snapshot, 'src/panel.ts', 'src/foo', 'dependents').sort()).toEqual(
      [makeDependencyKey('src/foo/a.ts', 'src/panel.ts'), makeDependencyKey('src/foo/b.ts', 'src/panel.ts')].sort(),
    );
  });
});
