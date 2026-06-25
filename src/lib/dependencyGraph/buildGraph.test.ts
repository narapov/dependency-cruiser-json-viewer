import type { IModule } from 'dependency-cruiser'
import { describe, expect, it } from 'vitest'
import { buildGraph } from './buildGraph'

function moduleAt(source: string): IModule {
  return { source, dependencies: [], dependents: [], valid: true } as IModule
}

const noopToggle = () => {}

describe('buildGraph half-checked folders', () => {
  const sources = [
    'src/foo/a.ts',
    'src/foo/b.ts',
    'src/bar/c.ts',
    'lib/y.ts',
  ]

  const modules = sources.map(moduleAt)

  it('includes half-checked ancestor folders when only a nested file is selected', () => {
    const { nodes } = buildGraph({
      modules,
      selectedPaths: ['src/foo/a.ts'],
      expandedFolders: new Set(['src']),
      highlightedNodeId: null,
      folderColors: new Map(),
      onToggleFolder: noopToggle,
    })

    const folderIds = nodes
      .filter((node) => node.type === 'folder' || node.type === 'folderGroup')
      .map((node) => node.id)

    expect(folderIds).toContain('src')
    expect(folderIds).toContain('src/foo')
    expect(nodes.some((node) => node.id === 'src/foo/a.ts')).toBe(false)
  })

  it('shows selected files inside expanded half-checked folders', () => {
    const { nodes } = buildGraph({
      modules,
      selectedPaths: ['src/foo/a.ts'],
      expandedFolders: new Set(['src', 'src/foo']),
      highlightedNodeId: null,
      folderColors: new Map(),
      onToggleFolder: noopToggle,
    })

    expect(nodes.some((node) => node.id === 'src/foo/a.ts' && node.type === 'file')).toBe(true)
    expect(nodes.some((node) => node.id === 'src/foo/b.ts')).toBe(false)
  })

  it('keeps fully selected folder behavior', () => {
    const selectedPaths = sources.filter((source) => source.startsWith('src/'))

    const { nodes } = buildGraph({
      modules,
      selectedPaths,
      expandedFolders: new Set(['src', 'src/foo', 'src/bar']),
      highlightedNodeId: null,
      folderColors: new Map(),
      onToggleFolder: noopToggle,
    })

    const nodeIds = nodes.map((node) => node.id)
    expect(nodeIds).toContain('src')
    expect(nodeIds).toContain('src/foo/a.ts')
    expect(nodeIds).toContain('src/foo/b.ts')
    expect(nodeIds).toContain('src/bar/c.ts')
    expect(nodeIds).not.toContain('lib/y.ts')
  })

  it('uses separate container roots for unrelated branches', () => {
    const { nodes } = buildGraph({
      modules,
      selectedPaths: ['src/foo/a.ts', 'lib/y.ts'],
      expandedFolders: new Set(['src', 'src/foo', 'lib']),
      highlightedNodeId: null,
      folderColors: new Map(),
      onToggleFolder: noopToggle,
    })

    const folderIds = nodes
      .filter((node) => node.type === 'folder' || node.type === 'folderGroup')
      .map((node) => node.id)

    expect(folderIds).toContain('src')
    expect(folderIds).toContain('lib')
    expect(nodes.some((node) => node.id === 'src/foo/a.ts' && node.type === 'file')).toBe(true)
    expect(nodes.some((node) => node.id === 'lib/y.ts' && node.type === 'file')).toBe(true)
  })
})
