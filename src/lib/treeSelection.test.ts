import { describe, expect, it } from 'vitest'
import { resolveActivePathAfterCollapse } from './treeSelection'

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
