import { describe, expect, it } from 'vitest'
import type { QuickPickCommand } from '../../types'
import { searchCommands } from './searchCommands'

function command(id: string, label: string): QuickPickCommand {
  return { id, label, onExecute: () => {} }
}

const commands = [
  command('clearLocalStorage', 'Clear Local Storage'),
  command('showActive', 'Show Active'),
  command('expandAllRecursive', 'Expand All Recursive'),
  command('collapseAllRecursive', 'Collapse All Recursive'),
]

describe('searchCommands', () => {
  it('returns all commands when query is empty', () => {
    expect(searchCommands(commands, '')).toEqual(commands)
  })

  it('filters commands by label', () => {
    const results = searchCommands(commands, 'expand')
    expect(results.map((item) => item.id)).toEqual(['expandAllRecursive'])
  })

  it('returns empty array when nothing matches', () => {
    expect(searchCommands(commands, 'missing')).toEqual([])
  })
})
