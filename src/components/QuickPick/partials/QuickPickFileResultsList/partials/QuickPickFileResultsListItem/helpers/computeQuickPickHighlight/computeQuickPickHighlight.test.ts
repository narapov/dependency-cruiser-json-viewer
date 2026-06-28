import { describe, expect, it } from 'vitest'
import { computeQuickPickHighlight } from './computeQuickPickHighlight'

describe('computeQuickPickHighlight', () => {
  it('returns indexes for a matching basename from name', () => {
    const result = computeQuickPickHighlight('app', 'App.tsx', 'src/components/App.tsx')
    expect(result.nameIndexes).toEqual([0, 1, 2])
    expect(result.pathIndexes).toEqual([])
  })

  it('returns empty indexes for empty query', () => {
    expect(computeQuickPickHighlight('', 'App.tsx', 'src/components/App.tsx')).toEqual({
      nameIndexes: [],
      pathIndexes: [],
    })
  })

  it('highlights dirname from key when name does not match', () => {
    const result = computeQuickPickHighlight('srccomp', 'App.tsx', 'src/components/App.tsx')
    expect(result.pathIndexes.length).toBeGreaterThan(0)
    expect(result.nameIndexes).toEqual([])
  })

  it('highlights name from name and dirname from key independently', () => {
    const result = computeQuickPickHighlight('srccomp', 'components', 'src/components')
    expect(result.nameIndexes.length).toBeGreaterThan(0)
    expect(result.pathIndexes.length).toBeGreaterThan(0)
  })

  it('highlights scattered query across path and basename from key', () => {
    const key = 'src/TaskTracker/contexts/SearchTaskQueryKeyContext'
    const name = 'SearchTaskQueryKeyContext'
    const result = computeQuickPickHighlight('srconteSearque', name, key)

    expect(result.pathIndexes.length).toBeGreaterThan(0)
    expect(result.nameIndexes.length).toBeGreaterThan(0)
  })

  it('uses key indexes for root items without a parent path', () => {
    const result = computeQuickPickHighlight('src', 'src', 'src')
    expect(result.nameIndexes.length).toBeGreaterThan(0)
    expect(result.pathIndexes).toEqual([])
  })
})
