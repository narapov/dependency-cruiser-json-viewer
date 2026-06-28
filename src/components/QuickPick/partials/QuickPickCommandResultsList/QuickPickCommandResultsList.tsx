import Box from '@mui/material/Box'
import type { RefObject } from 'react'
import type { QuickPickCommand } from '../../types'
import { QuickPickCommandResultsListItem } from './partials/QuickPickCommandResultsListItem'

interface QuickPickCommandResultsListProps {
  results: QuickPickCommand[]
  query: string
  highlightedIndex: number
  listRef: RefObject<HTMLUListElement | null>
  onHighlightIndex: (index: number) => void
  onSelect: (command: QuickPickCommand) => void
}

export function QuickPickCommandResultsList({
  results,
  query,
  highlightedIndex,
  listRef,
  onHighlightIndex,
  onSelect,
}: QuickPickCommandResultsListProps) {
  return (
    <Box
      component="ul"
      ref={listRef}
      role="listbox"
      sx={{
        flex: 1,
        minHeight: 0,
        m: 0,
        py: 0.5,
        px: 0,
        listStyle: 'none',
        overflowY: 'auto',
      }}
    >
      {results.map((command, index) => (
        <QuickPickCommandResultsListItem
          key={command.id}
          command={command}
          query={query}
          highlighted={index === highlightedIndex}
          onMouseEnter={() => onHighlightIndex(index)}
          onClick={() => onSelect(command)}
        />
      ))}
    </Box>
  )
}
