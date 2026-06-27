import { describe, expect, it } from 'vitest'
import { getDefaultExpandedKeys } from './getDefaultExpandedKeys'

describe('getDefaultExpandedKeys', () => {
  it('expands src when sources are under src', () => {
    expect(getDefaultExpandedKeys(['src/foo/a.ts'])).toEqual(['src'])
  })

  it('returns empty when src is absent', () => {
    expect(getDefaultExpandedKeys(['lib/foo.ts'])).toEqual([])
  })
})
