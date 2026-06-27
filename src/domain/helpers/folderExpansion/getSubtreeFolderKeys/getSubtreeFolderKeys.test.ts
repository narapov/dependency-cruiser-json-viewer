import { describe, expect, it } from 'vitest'
import { getSubtreeFolderKeys } from './getSubtreeFolderKeys'

const sources = ['src/foo/bar/baz.ts', 'src/foo/file.ts', 'src/other.ts']

describe('getSubtreeFolderKeys', () => {
  it('returns folder keys in subtree including root folder', () => {
    expect(getSubtreeFolderKeys('src/foo', sources)).toEqual(['src/foo', 'src/foo/bar'])
  })

  it('returns only the folder itself when it has no nested folders', () => {
    expect(getSubtreeFolderKeys('src/foo/bar', sources)).toEqual(['src/foo/bar'])
  })

  it('returns empty array when folder key is not found', () => {
    expect(getSubtreeFolderKeys('missing', sources)).toEqual([])
  })
})
