import { describe, expect, it } from 'vitest'
import { clampSidebarWidth, MIN_WIDTH } from './useSidebarWidth'

describe('clampSidebarWidth', () => {
  it('returns width when within bounds', () => {
    expect(clampSidebarWidth(280, 800)).toBe(280)
  })

  it('clamps to minimum width', () => {
    expect(clampSidebarWidth(100, 800)).toBe(MIN_WIDTH)
  })

  it('clamps to maximum width', () => {
    expect(clampSidebarWidth(900, 600)).toBe(600)
  })
})
