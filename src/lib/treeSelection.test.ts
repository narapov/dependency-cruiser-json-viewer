import { describe, expect, it } from 'vitest'
import type { TreeNodeData } from '../components/Tree'
import { getSubtreeFolderKeys, resolveActivePathAfterCollapse } from './treeSelection'

const treeData: TreeNodeData[] = [
  {
    key: 'src',
    title: 'src',
    children: [
      {
        key: 'src/foo',
        title: 'foo',
        children: [
          {
            key: 'src/foo/bar',
            title: 'bar',
            children: [{ key: 'src/foo/bar/baz.ts', title: 'baz.ts' }],
          },
          { key: 'src/foo/file.ts', title: 'file.ts' },
        ],
      },
      { key: 'src/other.ts', title: 'other.ts' },
    ],
  },
]

describe('getSubtreeFolderKeys', () => {
  it('returns folder keys in subtree including root folder', () => {
    expect(getSubtreeFolderKeys('src/foo', treeData)).toEqual([
      'src/foo',
      'src/foo/bar',
    ])
  })

  it('returns only the folder itself when it has no nested folders', () => {
    expect(getSubtreeFolderKeys('src/foo/bar', treeData)).toEqual(['src/foo/bar'])
  })

  it('returns empty array when folder key is not found', () => {
    expect(getSubtreeFolderKeys('missing', treeData)).toEqual([])
  })
})

describe('resolveActivePathAfterCollapse', () => {
  it('returns activePath unchanged when nothing collapsed', () => {
    expect(resolveActivePathAfterCollapse('src/foo/bar.ts', [])).toBe('src/foo/bar.ts')
  })

  it('returns null when activePath is null', () => {
    expect(resolveActivePathAfterCollapse(null, ['src'])).toBeNull()
  })

  it('moves activePath to collapsed folder when descendant is active', () => {
    expect(resolveActivePathAfterCollapse('src/foo/bar.ts', ['src/foo'])).toBe('src/foo')
  })

  it('picks deepest collapsed ancestor on collapse all', () => {
    expect(
      resolveActivePathAfterCollapse('src/foo/bar.ts', ['src', 'src/foo']),
    ).toBe('src/foo')
  })

  it('keeps activePath when collapse does not affect it', () => {
    expect(resolveActivePathAfterCollapse('src/foo/bar.ts', ['src/other'])).toBe('src/foo/bar.ts')
  })

  it('keeps folder active when collapsing the folder itself', () => {
    expect(resolveActivePathAfterCollapse('src/foo', ['src/foo'])).toBe('src/foo')
  })
})
