import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { getModuleRelations } from './getModuleRelations';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

const emptyFlags = {
  typeOnly: false,
  typeOnlyCircular: false,
};

describe('getModuleRelations', () => {
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

  const selectedPaths = ['src/foo/a.ts', 'src/foo/b.ts', 'src/bar/c.ts'];

  it('returns outgoing dependencies filtered by selected paths', () => {
    const { dependencies } = getModuleRelations('src/foo/a.ts', modules, selectedPaths);

    expect(dependencies).toEqual([
      { path: 'src/bar/c.ts', circular: false, ...emptyFlags },
      { path: 'src/foo/b.ts', circular: true, ...emptyFlags },
    ]);
  });

  it('returns incoming dependents filtered by selected paths', () => {
    const { dependents } = getModuleRelations('src/foo/a.ts', modules, selectedPaths);

    expect(dependents).toEqual([{ path: 'src/foo/b.ts', circular: true, ...emptyFlags }]);
  });

  it('excludes relations outside selected paths', () => {
    const { dependents } = getModuleRelations('src/foo/a.ts', modules, ['src/foo/a.ts', 'src/foo/b.ts']);

    expect(dependents).toEqual([{ path: 'src/foo/b.ts', circular: true, ...emptyFlags }]);
    expect(dependents.some(d => d.path === 'lib/y.ts')).toBe(false);
  });

  it('returns empty lists for unknown module', () => {
    const relations = getModuleRelations('missing.ts', modules, selectedPaths);

    expect(relations).toEqual({ dependencies: [], dependents: [] });
  });

  it('marks type-only dependencies', () => {
    const typeOnlyDep = {
      resolved: 'src/bar/c.ts',
      dependencyTypes: ['local', 'type-only', 'import'],
    } as IModule['dependencies'][0];

    const { dependencies } = getModuleRelations(
      'src/foo/a.ts',
      [moduleAt('src/foo/a.ts', [typeOnlyDep])],
      selectedPaths,
    );

    expect(dependencies).toEqual([{ path: 'src/bar/c.ts', circular: false, typeOnly: true, typeOnlyCircular: false }]);
  });

  it('marks type-only circular dependencies without value circular flag', () => {
    const typeOnlyCircularDep = {
      resolved: 'src/foo/b.ts',
      circular: true,
      dependencyTypes: ['local', 'type-only', 'import'],
    } as IModule['dependencies'][0];

    const { dependencies } = getModuleRelations(
      'src/foo/a.ts',
      [moduleAt('src/foo/a.ts', [typeOnlyCircularDep]), moduleAt('src/foo/b.ts')],
      selectedPaths,
    );

    expect(dependencies).toEqual([
      {
        path: 'src/foo/b.ts',
        circular: false,
        typeOnly: true,
        typeOnlyCircular: true,
      },
    ]);
  });

  it('merges mixed type-only and value imports on the same path', () => {
    const typeOnlyDep = {
      resolved: 'src/foo/b.ts',
      dependencyTypes: ['local', 'type-only', 'import'],
    } as IModule['dependencies'][0];
    const valueDep = {
      resolved: 'src/foo/b.ts',
      dependencyTypes: ['local', 'import'],
    } as IModule['dependencies'][0];

    const { dependencies } = getModuleRelations(
      'src/foo/a.ts',
      [moduleAt('src/foo/a.ts', [typeOnlyDep, valueDep]), moduleAt('src/foo/b.ts')],
      selectedPaths,
    );

    expect(dependencies).toEqual([{ path: 'src/foo/b.ts', circular: false, typeOnly: false, typeOnlyCircular: false }]);
  });
});
