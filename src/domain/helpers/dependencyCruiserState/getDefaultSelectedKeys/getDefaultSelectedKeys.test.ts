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

  it('excludes root node_modules and its descendants', () => {
    const sources = ['node_modules/pkg/index.js']
    const selected = getDefaultSelectedKeys(sources)

    expect(selected).not.toContain('node_modules')
    expect(selected).not.toContain('node_modules/pkg')
    expect(selected).not.toContain('node_modules/pkg/index.js')
  })

  it('excludes node_modules when mixed with other top-level folders', () => {
    const sources = ['src/a.ts', 'node_modules/b/index.js']
    const selected = getDefaultSelectedKeys(sources)

    expect(selected).toContain('src')
    expect(selected).toContain('src/a.ts')
    expect(selected).not.toContain('node_modules')
    expect(selected).not.toContain('node_modules/b')
    expect(selected).not.toContain('node_modules/b/index.js')
  })

  it('excludes nested node_modules under other top-level folders', () => {
    const sources = ['packages/app/node_modules/bar/index.js', 'packages/app/src/x.ts']
    const selected = getDefaultSelectedKeys(sources)

    expect(selected).toContain('packages')
    expect(selected).toContain('packages/app')
    expect(selected).toContain('packages/app/src')
    expect(selected).toContain('packages/app/src/x.ts')
    expect(selected).not.toContain('packages/app/node_modules')
    expect(selected).not.toContain('packages/app/node_modules/bar')
    expect(selected).not.toContain('packages/app/node_modules/bar/index.js')
  })
})
