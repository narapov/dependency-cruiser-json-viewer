import { describe, expect, it } from 'vitest'
import type { TreeNodeData } from '../components/Tree'
import { flattenTreeNodes, findTreeNode, searchTreeNodes } from './searchTreeNodes'

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

describe('searchTreeNodes', () => {
  const items = flattenTreeNodes(treeData)

  it('returns all items up to the limit for an empty query', () => {
    expect(searchTreeNodes(items, '')).toEqual(items)
    expect(searchTreeNodes(items, '   ')).toEqual(items)
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
    expect(searchTreeNodes(items, 'index').map((item) => item.key)).toEqual([
      'src/index.ts',
    ])
  })

  it('is case-insensitive', () => {
    expect(searchTreeNodes(items, 'BUTTON').map((item) => item.key)).toEqual([
      'src/components/Button.tsx',
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
