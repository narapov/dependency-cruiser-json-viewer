import { describe, expect, it } from 'vitest'
import { getDefaultSelectedKeys } from './getDefaultSelectedKeys'

describe('getDefaultSelectedKeys', () => {
  it('selects all paths under each top-level folder', () => {
    const sources = ['src/foo/a.ts', 'src/bar/b.ts', 'lib/x.ts']
    const selected = getDefaultSelectedKeys(sources)

    expect(selected).toContain('src')
    expect(selected).toContain('src/foo')
    expect(selected).toContain('src/foo/a.ts')
    expect(selected).toContain('src/bar')
    expect(selected).toContain('src/bar/b.ts')
    expect(selected).toContain('lib')
    expect(selected).toContain('lib/x.ts')
  })

  it('returns empty when there are no top-level folders', () => {
    expect(getDefaultSelectedKeys(['index.ts'])).toEqual([])
  })
})
