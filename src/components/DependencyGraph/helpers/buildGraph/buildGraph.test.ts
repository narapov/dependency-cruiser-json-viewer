import type { IModule } from 'dependency-cruiser'
import { describe, expect, it } from 'vitest'
import { CIRCULAR_EDGE_COLOR } from '../../../../Shared'
import { buildGraph } from './buildGraph'

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

describe('buildGraph layout', () => {
  const noopArgs = {
    highlightedNodeId: null,
    folderColors: new Map(),
    onToggleFolder: noopToggle,
    onExpandRecursive: noopExpandRecursive,
    onShowInFileTree: noopShowInFileTree,
  }

  function manySiblingSources(count: number) {
    return Array.from({ length: count }, (_, index) => `src/foo/f${index}.ts`)
  }

  it('many siblings without edges use grid layout', () => {
    const sources = manySiblingSources(8)
    const modules = sources.map((source) => moduleAt(source))

    const { nodes } = buildGraph({
      modules,
      selectedPaths: sources,
      expandedFolders: new Set(['src', 'src/foo']),
      ...noopArgs,
    })

    const fileNodes = nodes.filter((node) => node.type === 'file')
    const xValues = new Set(fileNodes.map((node) => node.position.x))
    expect(fileNodes).toHaveLength(8)
    expect(xValues.size).toBeGreaterThan(1)
  })

  it('connected siblings keep dagre layout', () => {
    const depB = { resolved: 'src/foo/b.ts' } as IModule['dependencies'][0]
    const depC = { resolved: 'src/foo/c.ts' } as IModule['dependencies'][0]
    const modules = [
      moduleAt('src/foo/a.ts', [depB]),
      moduleAt('src/foo/b.ts', [depC]),
      moduleAt('src/foo/c.ts'),
    ]

    const { nodes } = buildGraph({
      modules,
      selectedPaths: ['src/foo/a.ts', 'src/foo/b.ts', 'src/foo/c.ts'],
      expandedFolders: new Set(['src', 'src/foo']),
      ...noopArgs,
    })

    const pos = (id: string) => nodes.find((node) => node.id === id)!.position
    expect(pos('src/foo/a.ts').x).toBeLessThan(pos('src/foo/b.ts').x)
    expect(pos('src/foo/b.ts').x).toBeLessThan(pos('src/foo/c.ts').x)
  })

  it('group size grows with child count', () => {
    const mediumSources = manySiblingSources(6)
    const largeSources = manySiblingSources(12)
    const mediumModules = mediumSources.map((source) => moduleAt(source))
    const largeModules = largeSources.map((source) => moduleAt(source))

    const mediumGraph = buildGraph({
      modules: mediumModules,
      selectedPaths: mediumSources,
      expandedFolders: new Set(['src', 'src/foo']),
      ...noopArgs,
    })
    const largeGraph = buildGraph({
      modules: largeModules,
      selectedPaths: largeSources,
      expandedFolders: new Set(['src', 'src/foo']),
      ...noopArgs,
    })

    const mediumGroup = mediumGraph.nodes.find(
      (node) => node.id === 'src/foo' && node.type === 'folderGroup',
    )
    const largeGroup = largeGraph.nodes.find(
      (node) => node.id === 'src/foo' && node.type === 'folderGroup',
    )

    expect(largeGroup?.style?.width).toBeGreaterThan(mediumGroup?.style?.width as number)
    expect(largeGroup?.style?.height).toBeGreaterThan(mediumGroup?.style?.height as number)
  })
})
