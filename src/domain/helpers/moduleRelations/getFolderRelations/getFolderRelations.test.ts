import type { IModule } from 'dependency-cruiser'
import { describe, expect, it } from 'vitest'
import { getFolderRelations } from './getFolderRelations'

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule
}

const emptyFlags = {
  typeOnly: false,
  typeOnlyCircular: false,
}

describe('getFolderRelations', () => {
  const circularDep = {
    resolved: 'src/foo/b.ts',
    circular: true,
  } as IModule['dependencies'][0]

  const modules = [
    moduleAt('src/foo/a.ts', [circularDep, { resolved: 'src/bar/c.ts' } as IModule['dependencies'][0]]),
    moduleAt('src/foo/b.ts', [{ resolved: 'src/foo/a.ts', circular: true } as IModule['dependencies'][0]]),
    moduleAt('src/bar/c.ts'),
    moduleAt('lib/y.ts', [{ resolved: 'src/foo/a.ts' } as IModule['dependencies'][0]]),
  ]

  const selectedPaths = [
    'src/foo',
    'src/foo/a.ts',
    'src/foo/b.ts',
    'src/bar/c.ts',
    'lib/y.ts',
  ]

  it('aggregates outgoing dependencies for collapsed folder via representative', () => {
    const { dependencies } = getFolderRelations(
      'src/foo',
      modules,
      selectedPaths,
      new Set(),
    )

    expect(dependencies).toEqual([{ path: 'src/bar/c.ts', circular: false, ...emptyFlags }])
  })

  it('aggregates incoming dependents for collapsed folder via representative', () => {
    const { dependents } = getFolderRelations(
      'src/foo',
      modules,
      selectedPaths,
      new Set(),
    )

    expect(dependents).toEqual([{ path: 'lib/y.ts', circular: false, ...emptyFlags }])
  })

  it('includes external relations from descendant files when folder is expanded', () => {
    const halfCheckedSelected = ['src/foo/a.ts', 'src/foo/b.ts', 'src/bar/c.ts', 'lib/y.ts']

    const { dependencies, dependents } = getFolderRelations(
      'src/foo',
      modules,
      halfCheckedSelected,
      new Set(['src/foo']),
    )

    expect(dependencies).toEqual([{ path: 'src/bar/c.ts', circular: false, ...emptyFlags }])
    expect(dependents).toEqual([{ path: 'lib/y.ts', circular: false, ...emptyFlags }])
  })

  it('marks type-only dependencies aggregated at folder level', () => {
    const typeOnlyDep = {
      resolved: 'src/bar/c.ts',
      dependencyTypes: ['local', 'type-only', 'import'],
    } as IModule['dependencies'][0]

    const { dependencies } = getFolderRelations(
      'src/foo',
      [moduleAt('src/foo/a.ts', [typeOnlyDep])],
      ['src/foo', 'src/foo/a.ts', 'src/bar/c.ts'],
      new Set(),
    )

    expect(dependencies).toEqual([
      { path: 'src/bar/c.ts', circular: false, typeOnly: true, typeOnlyCircular: false },
    ])
  })
})
