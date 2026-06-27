import { describe, expect, it } from 'vitest'
import type { TreeNodeData } from '../../../Shared'
import {
  flattenTreeNodes,
  findTreeNode,
  getPathSearchTier,
  PathSearchTier,
  searchTreeNodes,
  type SearchableNode,
} from './searchTreeNodes'

const treeData: TreeNodeData[] = [
  {
    key: 'src',
    title: 'src',
    children: [
      {
        key: 'src/components',
        title: 'components',
        children: [
          { key: 'src/components/App.tsx', title: 'App.tsx' },
          { key: 'src/components/Button.tsx', title: 'Button.tsx' },
        ],
      },
      { key: 'src/index.ts', title: 'index.ts' },
    ],
  },
  { key: 'package.json', title: 'package.json' },
]

const fuzzyTreeData: TreeNodeData[] = [
  {
    key: 'src',
    title: 'src',
    children: [
      {
        key: 'src/TaskTracker',
        title: 'TaskTracker',
        children: [
          {
            key: 'src/TaskTracker/contexts',
            title: 'contexts',
            children: [
              {
                key: 'src/TaskTracker/contexts/SearchTaskQueryKeyContext',
                title: 'SearchTaskQueryKeyContext',
              },
            ],
          },
        ],
      },
      {
        key: 'src/components',
        title: 'components',
        children: [{ key: 'src/components/App.tsx', title: 'App.tsx' }],
      },
    ],
  },
]

describe('flattenTreeNodes', () => {
  it('returns all files and folders in tree order', () => {
    expect(flattenTreeNodes(treeData).map((item) => item.key)).toEqual([
      'src',
      'src/components',
      'src/components/App.tsx',
      'src/components/Button.tsx',
      'src/index.ts',
      'package.json',
    ])
  })

  it('marks folders and files correctly', () => {
    const items = flattenTreeNodes(treeData)
    expect(items.find((item) => item.key === 'src/components')?.isFolder).toBe(true)
    expect(items.find((item) => item.key === 'src/index.ts')?.isFolder).toBe(false)
  })
})

function searchableNode(key: string, name = key.split('/').pop() ?? key): SearchableNode {
  return {
    key,
    name,
    isFolder: false,
    node: { key, title: name },
  }
}

describe('getPathSearchTier', () => {
  it('classifies root and monorepo src paths', () => {
    expect(getPathSearchTier('src/foo.ts')).toBe(PathSearchTier.Src)
    expect(getPathSearchTier('packages/app/src/main.ts')).toBe(PathSearchTier.Src)
  })

  it('classifies root and monorepo lib paths', () => {
    expect(getPathSearchTier('lib/bar.ts')).toBe(PathSearchTier.Lib)
    expect(getPathSearchTier('packages/shared/lib/util.ts')).toBe(PathSearchTier.Lib)
  })

  it('classifies root and nested node_modules paths', () => {
    expect(getPathSearchTier('node_modules/pkg/index.js')).toBe(PathSearchTier.NodeModules)
    expect(getPathSearchTier('packages/foo/node_modules/bar/index.js')).toBe(
      PathSearchTier.NodeModules,
    )
  })

  it('does not treat lib-like names as lib tier', () => {
    expect(getPathSearchTier('my-lib/index.ts')).toBe(PathSearchTier.Other)
    expect(getPathSearchTier('package.json')).toBe(PathSearchTier.Other)
  })
})

describe('searchTreeNodes', () => {
  const items = flattenTreeNodes(treeData)

  it('returns no items for an empty query', () => {
    expect(searchTreeNodes(items, '')).toEqual([])
    expect(searchTreeNodes(items, '   ')).toEqual([])
  })

  it('filters by file name and path', () => {
    expect(searchTreeNodes(items, 'app').map((item) => item.key)).toEqual([
      'src/components/App.tsx',
    ])
    expect(searchTreeNodes(items, 'components').map((item) => item.key)).toEqual([
      'src/components',
      'src/components/App.tsx',
      'src/components/Button.tsx',
    ])
  })

  it('prioritizes exact and prefix name matches', () => {
    expect(searchTreeNodes(items, 'index').map((item) => item.key)).toEqual(['src/index.ts'])
  })

  it('is case-insensitive', () => {
    expect(searchTreeNodes(items, 'BUTTON').map((item) => item.key)).toEqual([
      'src/components/Button.tsx',
    ])
  })

  it('matches scattered query characters across the full path', () => {
    const fuzzyItems = flattenTreeNodes(fuzzyTreeData)

    expect(
      searchTreeNodes(fuzzyItems, 'srconteSearque').map((item) => item.key),
    ).toContain('src/TaskTracker/contexts/SearchTaskQueryKeyContext')
  })

  it('matches subsequence characters in path segments', () => {
    const fuzzyItems = flattenTreeNodes(fuzzyTreeData)

    expect(searchTreeNodes(fuzzyItems, 'scm').map((item) => item.key)).toContain('src/components')
  })

  it('does not match when query letters are out of order', () => {
    const fuzzyItems = flattenTreeNodes(fuzzyTreeData)

    expect(searchTreeNodes(fuzzyItems, 'rsc').map((item) => item.key)).not.toContain('src')
  })

  it('ranks src above lib, other, and node_modules for similar matches', () => {
    const tierItems = [
      searchableNode('node_modules/pkg/util.ts', 'util.ts'),
      searchableNode('tools/util.ts', 'util.ts'),
      searchableNode('lib/util.ts', 'util.ts'),
      searchableNode('src/util.ts', 'util.ts'),
    ]

    expect(searchTreeNodes(tierItems, 'util').map((item) => item.key)).toEqual([
      'src/util.ts',
      'lib/util.ts',
      'tools/util.ts',
      'node_modules/pkg/util.ts',
    ])
  })
})

describe('findTreeNode', () => {
  it('finds a node by key', () => {
    expect(findTreeNode(treeData, 'src/components/Button.tsx')?.title).toBe('Button.tsx')
  })

  it('returns undefined for missing keys', () => {
    expect(findTreeNode(treeData, 'missing')).toBeUndefined()
  })
})
