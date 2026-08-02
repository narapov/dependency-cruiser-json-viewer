import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { getFolderRelations } from './getFolderRelations';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

const emptyFlags = {
  typeOnly: false,
  typeOnlyCircular: false,
};

describe('getFolderRelations', () => {
  const circularDep = {
    resolved: 'src/foo/b.ts',
    circular: true,
  } as IModule['dependencies'][0];

  const modules = [
    moduleAt('src/foo/a.ts', [circularDep, { resolved: 'src/bar/c.ts' } as IModule['dependencies'][0]]),
    moduleAt('src/foo/b.ts', [{ resolved: 'src/foo/a.ts', circular: true } as IModule['dependencies'][0]]),
    moduleAt('src/bar/c.ts'),
    moduleAt('lib/y.ts', [{ resolved: 'src/foo/a.ts' } as IModule['dependencies'][0]]),
  ];

  const selectedPaths = ['src/foo', 'src/foo/a.ts', 'src/foo/b.ts', 'src/bar/c.ts', 'lib/y.ts'];

  it('aggregates outgoing dependencies for collapsed folder as a path tree', () => {
    const { dependencies } = getFolderRelations('src/foo', modules, selectedPaths, new Set());

    expect(dependencies).toEqual([
      {
        path: 'src',
        circular: false,
        ...emptyFlags,
        children: [
          {
            path: 'src/bar',
            circular: false,
            ...emptyFlags,
            children: [{ path: 'src/bar/c.ts', circular: false, ...emptyFlags }],
          },
        ],
      },
    ]);
  });

  it('aggregates incoming dependents for collapsed folder as a path tree', () => {
    const { dependents } = getFolderRelations('src/foo', modules, selectedPaths, new Set());

    expect(dependents).toEqual([
      {
        path: 'lib',
        circular: false,
        ...emptyFlags,
        children: [{ path: 'lib/y.ts', circular: false, ...emptyFlags }],
      },
    ]);
  });

  it('includes external relations from descendant files when folder is expanded', () => {
    const halfCheckedSelected = ['src/foo/a.ts', 'src/foo/b.ts', 'src/bar/c.ts', 'lib/y.ts'];

    const { dependencies, dependents } = getFolderRelations(
      'src/foo',
      modules,
      halfCheckedSelected,
      new Set(['src/foo']),
    );

    expect(dependencies).toEqual([
      {
        path: 'src',
        circular: false,
        ...emptyFlags,
        children: [
          {
            path: 'src/bar',
            circular: false,
            ...emptyFlags,
            children: [{ path: 'src/bar/c.ts', circular: false, ...emptyFlags }],
          },
        ],
      },
    ]);
    expect(dependents).toEqual([
      {
        path: 'lib',
        circular: false,
        ...emptyFlags,
        children: [{ path: 'lib/y.ts', circular: false, ...emptyFlags }],
      },
    ]);
  });

  it('marks type-only dependencies aggregated at folder level', () => {
    const typeOnlyDep = {
      resolved: 'src/bar/c.ts',
      dependencyTypes: ['local', 'type-only', 'import'],
    } as IModule['dependencies'][0];

    const { dependencies } = getFolderRelations(
      'src/foo',
      [moduleAt('src/foo/a.ts', [typeOnlyDep])],
      ['src/foo', 'src/foo/a.ts', 'src/bar/c.ts'],
      new Set(),
    );

    expect(dependencies).toEqual([
      {
        path: 'src',
        circular: false,
        typeOnly: true,
        typeOnlyCircular: false,
        children: [
          {
            path: 'src/bar',
            circular: false,
            typeOnly: true,
            typeOnlyCircular: false,
            children: [{ path: 'src/bar/c.ts', circular: false, typeOnly: true, typeOnlyCircular: false }],
          },
        ],
      },
    ]);
  });

  it('merges flags when expanded folder emits dual candidates for the same path', () => {
    const typeOnlyCircularDep = {
      resolved: 'src/bar/c.ts',
      circular: true,
      dependencyTypes: ['local', 'type-only', 'import'],
    } as IModule['dependencies'][0];

    const { dependencies } = getFolderRelations(
      'src/foo',
      [moduleAt('src/foo', [typeOnlyCircularDep]), moduleAt('src/bar/c.ts')],
      ['src/foo', 'src/bar/c.ts'],
      new Set(['src/foo']),
    );

    expect(dependencies).toEqual([
      {
        path: 'src',
        circular: false,
        typeOnly: true,
        typeOnlyCircular: true,
        children: [
          {
            path: 'src/bar',
            circular: false,
            typeOnly: true,
            typeOnlyCircular: true,
            children: [{ path: 'src/bar/c.ts', circular: false, typeOnly: true, typeOnlyCircular: true }],
          },
        ],
      },
    ]);
  });

  it('nests multiple real file endpoints under shared folders', () => {
    const { dependencies } = getFolderRelations(
      'src/foo',
      [
        moduleAt('src/foo/a.ts', [
          { resolved: 'src/bar/x.ts' } as IModule['dependencies'][0],
          { resolved: 'src/bar/y.ts' } as IModule['dependencies'][0],
        ]),
        moduleAt('src/bar/x.ts'),
        moduleAt('src/bar/y.ts'),
      ],
      ['src/foo', 'src/foo/a.ts', 'src/bar', 'src/bar/x.ts', 'src/bar/y.ts'],
      new Set(),
    );

    expect(dependencies).toEqual([
      {
        path: 'src',
        circular: false,
        ...emptyFlags,
        children: [
          {
            path: 'src/bar',
            circular: false,
            ...emptyFlags,
            children: [
              { path: 'src/bar/x.ts', circular: false, ...emptyFlags },
              { path: 'src/bar/y.ts', circular: false, ...emptyFlags },
            ],
          },
        ],
      },
    ]);
  });

  it('puts unselected crossing edges into hidden path trees', () => {
    const { dependents, hiddenDependents } = getFolderRelations(
      'src/foo',
      [
        moduleAt('src/foo/a.ts'),
        moduleAt('lib/vendor/y.ts', [{ resolved: 'src/foo/a.ts' } as IModule['dependencies'][0]]),
        moduleAt('lib/vendor/z.ts', [{ resolved: 'src/foo/a.ts' } as IModule['dependencies'][0]]),
      ],
      ['src/foo', 'src/foo/a.ts'],
      new Set(),
    );

    expect(dependents).toEqual([]);
    expect(hiddenDependents).toEqual([
      {
        path: 'lib',
        circular: false,
        ...emptyFlags,
        children: [
          {
            path: 'lib/vendor',
            circular: false,
            ...emptyFlags,
            children: [
              { path: 'lib/vendor/y.ts', circular: false, ...emptyFlags },
              { path: 'lib/vendor/z.ts', circular: false, ...emptyFlags },
            ],
          },
        ],
      },
    ]);
  });
});
