import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { makeDependencyKey } from '../makeDependencyKey';
import { getDependencyKeysBetweenPaths } from './getDependencyKeysBetweenPaths';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

describe('getDependencyKeysBetweenPaths', () => {
  it('returns a single key for a file source dependency', () => {
    const modules = [moduleAt('src/a.ts', [{ resolved: 'src/b.ts' } as IModule['dependencies'][0]])];

    expect(getDependencyKeysBetweenPaths('src/a.ts', 'src/b.ts', 'dependencies', modules)).toEqual([
      makeDependencyKey('src/a.ts', 'src/b.ts'),
    ]);
  });

  it('returns a single key for a file source dependent', () => {
    const modules = [moduleAt('src/b.ts', [{ resolved: 'src/a.ts' } as IModule['dependencies'][0]])];

    expect(getDependencyKeysBetweenPaths('src/a.ts', 'src/b.ts', 'dependents', modules)).toEqual([
      makeDependencyKey('src/b.ts', 'src/a.ts'),
    ]);
  });

  it('collects all under-folder deps for a folder source dependency', () => {
    const modules = [
      moduleAt('src/foo/a.ts', [{ resolved: 'src/bar/c.ts' } as IModule['dependencies'][0]]),
      moduleAt('src/foo/b.ts', [{ resolved: 'src/bar/c.ts' } as IModule['dependencies'][0]]),
      moduleAt('src/other/x.ts', [{ resolved: 'src/bar/c.ts' } as IModule['dependencies'][0]]),
    ];

    expect(getDependencyKeysBetweenPaths('src/foo', 'src/bar/c.ts', 'dependencies', modules)).toEqual([
      makeDependencyKey('src/foo/a.ts', 'src/bar/c.ts'),
      makeDependencyKey('src/foo/b.ts', 'src/bar/c.ts'),
    ]);
  });

  it('collects all under-folder targets for a folder source dependent', () => {
    const modules = [
      moduleAt('src/bar/c.ts', [
        { resolved: 'src/foo/a.ts' } as IModule['dependencies'][0],
        { resolved: 'src/foo/b.ts' } as IModule['dependencies'][0],
        { resolved: 'src/other/x.ts' } as IModule['dependencies'][0],
      ]),
    ];

    expect(getDependencyKeysBetweenPaths('src/foo', 'src/bar/c.ts', 'dependents', modules)).toEqual([
      makeDependencyKey('src/bar/c.ts', 'src/foo/a.ts'),
      makeDependencyKey('src/bar/c.ts', 'src/foo/b.ts'),
    ]);
  });

  it('collects deps under a folder target for a file source', () => {
    const modules = [
      moduleAt('src/a.ts', [
        { resolved: 'src/foo/b.ts' } as IModule['dependencies'][0],
        { resolved: 'src/foo/c.ts' } as IModule['dependencies'][0],
        { resolved: 'src/bar/d.ts' } as IModule['dependencies'][0],
      ]),
      moduleAt('src/foo/b.ts'),
      moduleAt('src/foo/c.ts'),
      moduleAt('src/bar/d.ts'),
    ];

    expect(getDependencyKeysBetweenPaths('src/a.ts', 'src/foo', 'dependencies', modules)).toEqual([
      makeDependencyKey('src/a.ts', 'src/foo/b.ts'),
      makeDependencyKey('src/a.ts', 'src/foo/c.ts'),
    ]);
  });

  it('collects deps between a folder source and a folder target', () => {
    const modules = [
      moduleAt('src/foo/a.ts', [
        { resolved: 'src/bar/c.ts' } as IModule['dependencies'][0],
        { resolved: 'src/other/x.ts' } as IModule['dependencies'][0],
      ]),
      moduleAt('src/foo/b.ts', [{ resolved: 'src/bar/d.ts' } as IModule['dependencies'][0]]),
      moduleAt('src/bar/c.ts'),
      moduleAt('src/bar/d.ts'),
      moduleAt('src/other/x.ts'),
    ];

    expect(getDependencyKeysBetweenPaths('src/foo', 'src/bar', 'dependencies', modules)).toEqual([
      makeDependencyKey('src/foo/a.ts', 'src/bar/c.ts'),
      makeDependencyKey('src/foo/b.ts', 'src/bar/d.ts'),
    ]);
  });

  it('collects dependents under a folder relation for a file panel', () => {
    const modules = [
      moduleAt('src/foo/a.ts', [{ resolved: 'src/panel.ts' } as IModule['dependencies'][0]]),
      moduleAt('src/foo/b.ts', [{ resolved: 'src/panel.ts' } as IModule['dependencies'][0]]),
      moduleAt('src/other/x.ts', [{ resolved: 'src/panel.ts' } as IModule['dependencies'][0]]),
      moduleAt('src/panel.ts'),
    ];

    expect(getDependencyKeysBetweenPaths('src/panel.ts', 'src/foo', 'dependents', modules)).toEqual([
      makeDependencyKey('src/foo/a.ts', 'src/panel.ts'),
      makeDependencyKey('src/foo/b.ts', 'src/panel.ts'),
    ]);
  });
});
