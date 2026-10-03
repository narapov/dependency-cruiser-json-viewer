import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { buildCruiseSnapshot } from '../../cruiseSnapshot';
import { getVisibleTree } from './getVisibleTree';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

function selected(...paths: string[]): Record<string, boolean | undefined> {
  return Object.fromEntries(paths.map(path => [path, true]));
}

describe('getVisibleTree', () => {
  const modules = [
    moduleAt('src/foo/a.ts', [
      { resolved: 'src/foo/b.ts', circular: true, dependencyTypes: ['local'] } as IModule['dependencies'][0],
    ]),
    moduleAt('src/foo/b.ts', [
      { resolved: 'src/foo/a.ts', circular: true, dependencyTypes: ['local'] } as IModule['dependencies'][0],
    ]),
    moduleAt('src/bar/c.ts', [
      {
        resolved: 'src/foo/a.ts',
        typeOnly: true,
        circular: true,
        dependencyTypes: ['type-only'],
      } as IModule['dependencies'][0],
    ]),
  ];

  it('collapses unexpanded folders to leaf nodes', () => {
    const snapshot = buildCruiseSnapshot(modules);
    const tree = getVisibleTree(snapshot, selected('src/foo/a.ts', 'src/foo/b.ts'), {});

    expect(tree).toEqual([
      {
        path: 'src',
        ancestors: [],
        descendants: [],
        valueCircular: true,
        typeOnlyCircular: false,
      },
    ]);
  });

  it('expands folders and marks circular flags on selected relations', () => {
    const snapshot = buildCruiseSnapshot(modules);
    const tree = getVisibleTree(snapshot, selected('src/foo/a.ts', 'src/foo/b.ts', 'src/bar/c.ts'), {
      src: true,
      'src/foo': true,
      'src/bar': true,
    });

    expect(tree).toEqual([
      {
        path: 'src',
        ancestors: [],
        descendants: ['src/bar', 'src/bar/c.ts', 'src/foo', 'src/foo/a.ts', 'src/foo/b.ts'],
        valueCircular: true,
        typeOnlyCircular: false,
        children: [
          {
            path: 'src/bar',
            ancestors: ['src'],
            descendants: ['src/bar/c.ts'],
            valueCircular: false,
            typeOnlyCircular: true,
            children: [
              {
                path: 'src/bar/c.ts',
                ancestors: ['src/bar', 'src'],
                descendants: [],
                valueCircular: false,
                typeOnlyCircular: true,
              },
            ],
          },
          {
            path: 'src/foo',
            ancestors: ['src'],
            descendants: ['src/foo/a.ts', 'src/foo/b.ts'],
            valueCircular: true,
            typeOnlyCircular: false,
            children: [
              {
                path: 'src/foo/a.ts',
                ancestors: ['src/foo', 'src'],
                descendants: [],
                valueCircular: true,
                typeOnlyCircular: false,
              },
              {
                path: 'src/foo/b.ts',
                ancestors: ['src/foo', 'src'],
                descendants: [],
                valueCircular: true,
                typeOnlyCircular: false,
              },
            ],
          },
        ],
      },
    ]);
  });

  it('ignores circular deps to unselected modules', () => {
    const snapshot = buildCruiseSnapshot(modules);
    const tree = getVisibleTree(snapshot, selected('src/bar/c.ts'), { src: true, 'src/bar': true });

    expect(tree).toEqual([
      {
        path: 'src',
        ancestors: [],
        descendants: ['src/bar', 'src/bar/c.ts'],
        valueCircular: false,
        typeOnlyCircular: false,
        children: [
          {
            path: 'src/bar',
            ancestors: ['src'],
            descendants: ['src/bar/c.ts'],
            valueCircular: false,
            typeOnlyCircular: false,
            children: [
              {
                path: 'src/bar/c.ts',
                ancestors: ['src/bar', 'src'],
                descendants: [],
                valueCircular: false,
                typeOnlyCircular: false,
              },
            ],
          },
        ],
      },
    ]);
  });

  it('indexes ancestors nearest→root and descendants for nested folders', () => {
    const snapshot = buildCruiseSnapshot([moduleAt('src/a.ts'), moduleAt('src/util/b.ts')]);
    const [src] = getVisibleTree(snapshot, selected('src/a.ts', 'src/util/b.ts'), {
      src: true,
      'src/util': true,
    });

    const util = src?.children?.find(child => child.path === 'src/util');
    const a = src?.children?.find(child => child.path === 'src/a.ts');

    expect(util?.ancestors).toEqual(['src']);
    expect(util?.descendants).toEqual(['src/util/b.ts']);
    expect(a?.ancestors).toEqual(['src']);
    expect(a?.descendants).toEqual([]);
    expect(src?.descendants).toEqual(expect.arrayContaining(['src/a.ts', 'src/util', 'src/util/b.ts']));
  });
});
