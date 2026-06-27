import type { IModule } from 'dependency-cruiser'
import { describe, expect, it } from 'vitest'
import { getFolderRelations } from './getFolderRelations'

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule
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

    expect(dependencies).toEqual([{ path: 'src/bar/c.ts', circular: false }])
  })

  it('aggregates incoming dependents for collapsed folder via representative', () => {
    const { dependents } = getFolderRelations(
      'src/foo',
      modules,
      selectedPaths,
      new Set(),
    )

    expect(dependents).toEqual([{ path: 'lib/y.ts', circular: false }])
  })

  it('includes external relations from descendant files when folder is expanded', () => {
    const halfCheckedSelected = ['src/foo/a.ts', 'src/foo/b.ts', 'src/bar/c.ts', 'lib/y.ts']

    const { dependencies, dependents } = getFolderRelations(
      'src/foo',
      modules,
      halfCheckedSelected,
      new Set(['src/foo']),
    )

    expect(dependencies).toEqual([{ path: 'src/bar/c.ts', circular: false }])
    expect(dependents).toEqual([{ path: 'lib/y.ts', circular: false }])
  })
})
