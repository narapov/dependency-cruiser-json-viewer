import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { buildCruiseSnapshot } from '../../cruiseSnapshot';
import { makeDependencyKey } from '../../dependencyKey';
import { getVisibleTree } from '../getVisibleTree';
import { getEdgesForVisibleTree } from './getEdgesForVisibleTree';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

function selected(...paths: string[]): Record<string, boolean | undefined> {
  return Object.fromEntries(paths.map(path => [path, true]));
}

describe('getEdgesForVisibleTree', () => {
  it('builds leaf edges via target and targetAncestors among selected modules', () => {
    const modules = [
      moduleAt('src/foo/a.ts', [
        {
          resolved: 'src/bar/c.ts',
          circular: true,
          dependencyTypes: ['local'],
          rules: [{ name: 'no-circular', severity: 'error' }],
        } as IModule['dependencies'][0],
      ]),
      moduleAt('src/bar/c.ts'),
    ];
    const snapshot = buildCruiseSnapshot(modules);
    const selectedFilePaths = selected('src/foo/a.ts', 'src/bar/c.ts');
    const visibleTree = getVisibleTree(snapshot, selectedFilePaths, {
      src: true,
      'src/foo': true,
      'src/bar': true,
    });

    const edges = getEdgesForVisibleTree(snapshot, visibleTree, selectedFilePaths);

    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({
      source: 'src/foo/a.ts',
      target: 'src/bar/c.ts',
      key: makeDependencyKey('src/foo/a.ts', 'src/bar/c.ts'),
      valueCircular: true,
      typeOnlyCircular: false,
    });
    expect(edges[0]?.violations.severity).toBe('error');
    expect([...edges[0]!.violations.ruleNames]).toEqual(['no-circular']);
  });

  it('aggregates to collapsed folder leaves via targetAncestors', () => {
    const modules = [
      moduleAt('src/foo/a.ts', [
        { resolved: 'src/bar/c.ts', dependencyTypes: ['local'] } as IModule['dependencies'][0],
      ]),
      moduleAt('src/bar/c.ts'),
    ];
    const snapshot = buildCruiseSnapshot(modules);
    const selectedFilePaths = selected('src/foo/a.ts', 'src/bar/c.ts');
    const visibleTree = getVisibleTree(snapshot, selectedFilePaths, {
      src: true,
      'src/foo': true,
    });

    const edges = getEdgesForVisibleTree(snapshot, visibleTree, selectedFilePaths);

    expect(edges).toEqual([
      expect.objectContaining({
        source: 'src/foo/a.ts',
        target: 'src/bar',
        key: makeDependencyKey('src/foo/a.ts', 'src/bar'),
        valueCircular: false,
        typeOnlyCircular: false,
      }),
    ]);
  });
});
