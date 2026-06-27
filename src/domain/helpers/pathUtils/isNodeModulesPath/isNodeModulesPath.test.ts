import { describe, expect, it } from 'vitest'
import { isNodeModulesPath } from './isNodeModulesPath'

describe('isNodeModulesPath', () => {
  it('returns true for root node_modules', () => {
    expect(isNodeModulesPath('node_modules')).toBe(true)
  })

  it('returns true for paths under node_modules', () => {
    expect(isNodeModulesPath('node_modules/pkg/index.js')).toBe(true)
  })

  it('returns true for nested node_modules segments', () => {
    expect(isNodeModulesPath('packages/foo/node_modules/bar/index.js')).toBe(true)
  })

  it('returns false for regular project paths', () => {
    expect(isNodeModulesPath('src/foo.ts')).toBe(false)
    expect(isNodeModulesPath('lib/utils/index.ts')).toBe(false)
  })
})
