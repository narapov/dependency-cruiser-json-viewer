import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { buildCruiseSnapshot } from '../../cruiseSnapshot';
import { getNodeRelations } from './getNodeRelations';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

function selected(...paths: string[]): Record<string, boolean | undefined> {
  return Object.fromEntries(paths.map(path => [path, true]));
}

const emptyFlags = {
  typeOnly: false,
  typeOnlyCircular: false,
};

describe('getNodeRelations', () => {
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

  const selectedFilePaths = selected('src/foo/a.ts', 'src/foo/b.ts', 'src/bar/c.ts');

  it('returns empty lists for an unknown path', () => {
    expect(getNodeRelations('missing', buildCruiseSnapshot(modules), selectedFilePaths)).toEqual({
      dependencies: [],
      dependents: [],
      hiddenDependencies: [],
      hiddenDependents: [],
    });
  });

  it('returns file outgoing dependencies as a nested path tree', () => {
    const { dependencies } = getNodeRelations('src/foo/a.ts', buildCruiseSnapshot(modules), selectedFilePaths);

    expect(dependencies).toEqual([
      {
        path: 'src',
        circular: true,
        ...emptyFlags,
        children: [
          {
            path: 'src/bar',
            circular: false,
            ...emptyFlags,
            children: [{ path: 'src/bar/c.ts', circular: false, ...emptyFlags }],
          },
          {
            path: 'src/foo',
            circular: true,
            ...emptyFlags,
            children: [{ path: 'src/foo/b.ts', circular: true, ...emptyFlags }],
          },
        ],
      },
    ]);
  });

  it('returns file incoming dependents as a nested path tree', () => {
    const { dependents } = getNodeRelations('src/foo/a.ts', buildCruiseSnapshot(modules), selectedFilePaths);

    expect(dependents).toEqual([
      {
        path: 'src',
        circular: true,
        ...emptyFlags,
        children: [
          {
            path: 'src/foo',
            circular: true,
            ...emptyFlags,
            children: [{ path: 'src/foo/b.ts', circular: true, ...emptyFlags }],
          },
        ],
      },
    ]);
  });

  it('puts unselected file endpoints into hidden path trees', () => {
    const { dependents, hiddenDependents } = getNodeRelations(
      'src/foo/a.ts',
      buildCruiseSnapshot(modules),
      selected('src/foo/a.ts', 'src/foo/b.ts'),
    );

    expect(dependents).toEqual([
      {
        path: 'src',
        circular: true,
        ...emptyFlags,
        children: [
          {
            path: 'src/foo',
            circular: true,
            ...emptyFlags,
            children: [{ path: 'src/foo/b.ts', circular: true, ...emptyFlags }],
          },
        ],
      },
    ]);
    expect(hiddenDependents).toEqual([
      {
        path: 'lib',
        circular: false,
        ...emptyFlags,
        children: [{ path: 'lib/y.ts', circular: false, ...emptyFlags }],
      },
    ]);
  });

  it('aggregates folder leave/enter edges the same way as files', () => {
    const allSelected = selected('src/foo/a.ts', 'src/foo/b.ts', 'src/bar/c.ts', 'lib/y.ts');
    const snapshot = buildCruiseSnapshot(modules);

    expect(getNodeRelations('src/foo', snapshot, allSelected).dependencies).toEqual([
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
    expect(getNodeRelations('src/foo', snapshot, allSelected).dependents).toEqual([
      {
        path: 'lib',
        circular: false,
        ...emptyFlags,
        children: [{ path: 'lib/y.ts', circular: false, ...emptyFlags }],
      },
    ]);
  });

  it('puts unselected folder endpoints into hidden path trees', () => {
    const { dependents, hiddenDependents } = getNodeRelations(
      'src/foo',
      buildCruiseSnapshot([
        moduleAt('src/foo/a.ts'),
        moduleAt('lib/vendor/y.ts', [{ resolved: 'src/foo/a.ts' } as IModule['dependencies'][0]]),
        moduleAt('lib/vendor/z.ts', [{ resolved: 'src/foo/a.ts' } as IModule['dependencies'][0]]),
      ]),
      selected('src/foo/a.ts'),
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

  it('marks type-only and type-only circular flags', () => {
    const typeOnlyCircularDep = {
      resolved: 'src/bar/c.ts',
      circular: true,
      dependencyTypes: ['local', 'type-only', 'import'],
    } as IModule['dependencies'][0];

    const { dependencies } = getNodeRelations(
      'src/foo',
      buildCruiseSnapshot([moduleAt('src/foo/a.ts', [typeOnlyCircularDep]), moduleAt('src/bar/c.ts')]),
      selected('src/foo/a.ts', 'src/bar/c.ts'),
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

  it('nests multiple endpoints under shared folders', () => {
    const { dependencies } = getNodeRelations(
      'src/bar/c.ts',
      buildCruiseSnapshot([
        moduleAt('src/bar/c.ts', [
          { resolved: 'src/foo/a.ts' } as IModule['dependencies'][0],
          { resolved: 'src/foo/b.ts' } as IModule['dependencies'][0],
        ]),
        moduleAt('src/foo/a.ts'),
        moduleAt('src/foo/b.ts'),
      ]),
      selected('src/bar/c.ts', 'src/foo/a.ts', 'src/foo/b.ts'),
    );

    expect(dependencies).toEqual([
      {
        path: 'src',
        circular: false,
        ...emptyFlags,
        children: [
          {
            path: 'src/foo',
            circular: false,
            ...emptyFlags,
            children: [
              { path: 'src/foo/a.ts', circular: false, ...emptyFlags },
              { path: 'src/foo/b.ts', circular: false, ...emptyFlags },
            ],
          },
        ],
      },
    ]);
  });
});
