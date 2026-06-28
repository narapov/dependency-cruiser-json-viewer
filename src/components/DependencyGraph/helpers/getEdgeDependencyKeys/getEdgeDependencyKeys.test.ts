import type { IModule } from 'dependency-cruiser'
import { describe, expect, it } from 'vitest'
import { buildGraph } from '../buildGraph/buildGraph'
import {
  buildEdgeDependencyKeyMap,
  getEdgeDependencyKeys,
  makeDependencyKey,
} from './getEdgeDependencyKeys'

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule
}

const noopToggle = () => {}
const noopShowInFileTree = () => {}
const noopExpandRecursive = () => {}

describe('getEdgeDependencyKeys', () => {
  const modules = [
    moduleAt('src/foo/a.ts', [{ resolved: 'src/bar/c.ts' } as IModule['dependencies'][0]]),
    moduleAt('src/foo/b.ts', [{ resolved: 'src/bar/c.ts' } as IModule['dependencies'][0]]),
    moduleAt('src/bar/c.ts'),
  ]

  const selectedPaths = ['src/foo', 'src/foo/a.ts', 'src/foo/b.ts', 'src/bar/c.ts']

  it('returns stable file-level keys regardless of expanded folders', () => {
    const collapsed = new Set(['src', 'src/bar'])
    const expanded = new Set(['src', 'src/foo', 'src/bar'])

    const collapsedKeys = getEdgeDependencyKeys(
      modules,
      selectedPaths,
      collapsed,
      'src/foo',
      'src/bar/c.ts',
    )
    const expandedKeysA = getEdgeDependencyKeys(
      modules,
      selectedPaths,
      expanded,
      'src/foo/a.ts',
      'src/bar/c.ts',
    )
    const expandedKeysB = getEdgeDependencyKeys(
      modules,
      selectedPaths,
      expanded,
      'src/foo/b.ts',
      'src/bar/c.ts',
    )

    expect(collapsedKeys).toEqual([
      makeDependencyKey('src/foo/a.ts', 'src/bar/c.ts'),
      makeDependencyKey('src/foo/b.ts', 'src/bar/c.ts'),
    ])
    expect(expandedKeysA).toEqual([makeDependencyKey('src/foo/a.ts', 'src/bar/c.ts')])
    expect(expandedKeysB).toEqual([makeDependencyKey('src/foo/b.ts', 'src/bar/c.ts')])
  })

  it('aggregates multiple file-level pairs into one visual edge', () => {
    const { edges } = buildGraph({
      modules,
      selectedPaths,
      expandedFolders: new Set(['src', 'src/bar']),
      highlightedNodeId: null,
      folderColors: new Map(),
      onToggleFolder: noopToggle,
      onExpandRecursive: noopExpandRecursive,
      onShowInFileTree: noopShowInFileTree,
    })

    const edge = edges.find((item) => item.source === 'src/foo' && item.target === 'src/bar/c.ts')
    expect(edge).toBeDefined()

    const keys = getEdgeDependencyKeys(
      modules,
      selectedPaths,
      new Set(['src', 'src/bar']),
      edge!.source,
      edge!.target,
    )

    expect(keys).toHaveLength(2)
    expect(keys).toContain(makeDependencyKey('src/foo/a.ts', 'src/bar/c.ts'))
    expect(keys).toContain(makeDependencyKey('src/foo/b.ts', 'src/bar/c.ts'))
  })

  it('builds a map from visual edge ids to dependency keys', () => {
    const expandedFolders = new Set(['src', 'src/foo', 'src/bar'])
    const { edges } = buildGraph({
      modules,
      selectedPaths,
      expandedFolders,
      highlightedNodeId: null,
      folderColors: new Map(),
      onToggleFolder: noopToggle,
      onExpandRecursive: noopExpandRecursive,
      onShowInFileTree: noopShowInFileTree,
    })

    const map = buildEdgeDependencyKeyMap(modules, selectedPaths, expandedFolders, edges)
    const edgeA = edges.find((item) => item.source === 'src/foo/a.ts')
    const edgeB = edges.find((item) => item.source === 'src/foo/b.ts')

    expect(map.get(edgeA!.id)).toEqual([
      makeDependencyKey('src/foo/a.ts', 'src/bar/c.ts'),
    ])
    expect(map.get(edgeB!.id)).toEqual([
      makeDependencyKey('src/foo/b.ts', 'src/bar/c.ts'),
    ])
  })
})
