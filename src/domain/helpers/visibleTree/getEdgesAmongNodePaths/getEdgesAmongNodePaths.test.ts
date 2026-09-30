import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { buildCruiseSnapshot } from '../../cruiseSnapshot';
import { makeDependencyKey } from '../../dependencyKey';
import { getEdgesAmongNodePaths } from './getEdgesAmongNodePaths';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

function selected(...paths: string[]): Record<string, boolean | undefined> {
  return Object.fromEntries(paths.map(path => [path, true]));
}

describe('getEdgesAmongNodePaths', () => {
  it('builds edges among explicit folder siblings via targetAncestors', () => {
    const modules = [
      moduleAt('src/foo/a.ts', [
        { resolved: 'src/bar/c.ts', dependencyTypes: ['local'] } as IModule['dependencies'][0],
      ]),
      moduleAt('src/foo/b.ts', [
        { resolved: 'src/bar/c.ts', dependencyTypes: ['local'] } as IModule['dependencies'][0],
      ]),
      moduleAt('src/bar/c.ts'),
    ];
    const snapshot = buildCruiseSnapshot(modules);
    const selectedFilePaths = selected('src/foo/a.ts', 'src/foo/b.ts', 'src/bar/c.ts');

    const edges = getEdgesAmongNodePaths(snapshot, ['src/foo', 'src/bar'], selectedFilePaths);

    expect(edges).toEqual([
      expect.objectContaining({
        source: 'src/foo',
        target: 'src/bar',
        key: makeDependencyKey('src/foo', 'src/bar'),
      }),
    ]);
    expect(edges[0]?.aggregated).toHaveLength(2);
  });

  it('builds edges among file siblings under the same folder', () => {
    const modules = [
      moduleAt('src/foo/a.ts', [
        { resolved: 'src/foo/b.ts', dependencyTypes: ['local'] } as IModule['dependencies'][0],
      ]),
      moduleAt('src/foo/b.ts'),
    ];
    const snapshot = buildCruiseSnapshot(modules);
    const selectedFilePaths = selected('src/foo/a.ts', 'src/foo/b.ts');

    const edges = getEdgesAmongNodePaths(snapshot, ['src/foo/a.ts', 'src/foo/b.ts'], selectedFilePaths);

    expect(edges).toEqual([
      expect.objectContaining({
        source: 'src/foo/a.ts',
        target: 'src/foo/b.ts',
        key: makeDependencyKey('src/foo/a.ts', 'src/foo/b.ts'),
      }),
    ]);
  });
});
