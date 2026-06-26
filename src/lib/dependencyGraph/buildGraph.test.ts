import type { IModule } from 'dependency-cruiser'
import { describe, expect, it } from 'vitest'
import { buildGraph, CIRCULAR_EDGE_COLOR } from './buildGraph'

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule
}

const noopToggle = () => {}
const noopShowInFileTree = () => {}
const noopExpandRecursive = () => {}

describe('buildGraph half-checked folders', () => {
  const sources = [
    'src/foo/a.ts',
    'src/foo/b.ts',
    'src/bar/c.ts',
    'lib/y.ts',
  ]

  const modules = sources.map((source) => moduleAt(source))

  it('includes half-checked ancestor folders when only a nested file is selected', () => {
    const { nodes } = buildGraph({
      modules,
      selectedPaths: ['src/foo/a.ts'],
      expandedFolders: new Set(['src']),
      highlightedNodeId: null,
      folderColors: new Map(),
      onToggleFolder: noopToggle,
      onExpandRecursive: noopExpandRecursive,
      onShowInFileTree: noopShowInFileTree,
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
      onExpandRecursive: noopExpandRecursive,
      onShowInFileTree: noopShowInFileTree,
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
      onExpandRecursive: noopExpandRecursive,
      onShowInFileTree: noopShowInFileTree,
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
      onExpandRecursive: noopExpandRecursive,
      onShowInFileTree: noopShowInFileTree,
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

describe('buildGraph circular dependencies', () => {
  const circularDep = {
    resolved: 'src/foo/b.ts',
    circular: true,
  } as IModule['dependencies'][0]

  const modules = [
    moduleAt('src/foo/a.ts', [circularDep]),
    moduleAt('src/foo/b.ts'),
  ]

  it('marks file nodes with circular dependencies', () => {
    const { nodes } = buildGraph({
      modules,
      selectedPaths: ['src/foo/a.ts', 'src/foo/b.ts'],
      expandedFolders: new Set(['src', 'src/foo']),
      highlightedNodeId: null,
      folderColors: new Map(),
      onToggleFolder: noopToggle,
      onExpandRecursive: noopExpandRecursive,
      onShowInFileTree: noopShowInFileTree,
    })

    const fileNode = nodes.find((node) => node.id === 'src/foo/a.ts')
    expect(fileNode?.data.circular).toBe(true)
  })

  it('marks collapsed folders containing circular files', () => {
    const { nodes } = buildGraph({
      modules,
      selectedPaths: ['src/foo/a.ts', 'src/foo/b.ts'],
      expandedFolders: new Set(['src']),
      highlightedNodeId: null,
      folderColors: new Map(),
      onToggleFolder: noopToggle,
      onExpandRecursive: noopExpandRecursive,
      onShowInFileTree: noopShowInFileTree,
    })

    const folderNode = nodes.find((node) => node.id === 'src/foo' && node.type === 'folder')
    expect(folderNode?.data.circular).toBe(true)
  })

  it('does not mark expanded folder groups as circular', () => {
    const { nodes } = buildGraph({
      modules,
      selectedPaths: ['src/foo/a.ts', 'src/foo/b.ts'],
      expandedFolders: new Set(['src', 'src/foo']),
      highlightedNodeId: null,
      folderColors: new Map(),
      onToggleFolder: noopToggle,
      onExpandRecursive: noopExpandRecursive,
      onShowInFileTree: noopShowInFileTree,
    })

    const groupNode = nodes.find((node) => node.id === 'src/foo' && node.type === 'folderGroup')
    expect(groupNode?.data.circular).toBeUndefined()
  })

  it('colors circular edges red', () => {
    const { edges } = buildGraph({
      modules,
      selectedPaths: ['src/foo/a.ts', 'src/foo/b.ts'],
      expandedFolders: new Set(['src', 'src/foo']),
      highlightedNodeId: null,
      folderColors: new Map(),
      onToggleFolder: noopToggle,
      onExpandRecursive: noopExpandRecursive,
      onShowInFileTree: noopShowInFileTree,
    })

    const circularEdge = edges.find((edge) => edge.source === 'src/foo/a.ts')
    expect(circularEdge?.style?.stroke).toBe(CIRCULAR_EDGE_COLOR)
  })

  it('keeps circular edge red when node is highlighted', () => {
    const { edges } = buildGraph({
      modules,
      selectedPaths: ['src/foo/a.ts', 'src/foo/b.ts'],
      expandedFolders: new Set(['src', 'src/foo']),
      highlightedNodeId: 'src/foo/a.ts',
      folderColors: new Map(),
      onToggleFolder: noopToggle,
      onExpandRecursive: noopExpandRecursive,
      onShowInFileTree: noopShowInFileTree,
    })

    const circularEdge = edges.find((edge) => edge.source === 'src/foo/a.ts')
    expect(circularEdge?.style?.stroke).toBe(CIRCULAR_EDGE_COLOR)
  })
})
