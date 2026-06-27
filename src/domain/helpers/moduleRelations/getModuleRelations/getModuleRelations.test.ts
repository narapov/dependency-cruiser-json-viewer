import type { IModule } from 'dependency-cruiser'
import { describe, expect, it } from 'vitest'
import { getModuleRelations } from './getModuleRelations'

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule
}

describe('getModuleRelations', () => {
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

  const selectedPaths = ['src/foo/a.ts', 'src/foo/b.ts', 'src/bar/c.ts']

  it('returns outgoing dependencies filtered by selected paths', () => {
    const { dependencies } = getModuleRelations('src/foo/a.ts', modules, selectedPaths)

    expect(dependencies).toEqual([
      { path: 'src/bar/c.ts', circular: false },
      { path: 'src/foo/b.ts', circular: true },
    ])
  })

  it('returns incoming dependents filtered by selected paths', () => {
    const { dependents } = getModuleRelations('src/foo/a.ts', modules, selectedPaths)

    expect(dependents).toEqual([{ path: 'src/foo/b.ts', circular: true }])
  })

  it('excludes relations outside selected paths', () => {
    const { dependents } = getModuleRelations('src/foo/a.ts', modules, [
      'src/foo/a.ts',
      'src/foo/b.ts',
    ])

    expect(dependents).toEqual([{ path: 'src/foo/b.ts', circular: true }])
    expect(dependents.some((d) => d.path === 'lib/y.ts')).toBe(false)
  })

  it('returns empty lists for unknown module', () => {
    const relations = getModuleRelations('missing.ts', modules, selectedPaths)

    expect(relations).toEqual({ dependencies: [], dependents: [] })
  })
})
