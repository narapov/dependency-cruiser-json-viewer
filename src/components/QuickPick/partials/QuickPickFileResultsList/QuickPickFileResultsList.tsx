import Box from '@mui/material/Box'
import type { RefObject } from 'react'
import type { QuickPickFileItem } from '../../QuickPick.types'
import { QuickPickFileResultsListItem } from './partials/QuickPickFileResultsListItem'

interface QuickPickFileResultsListProps {
  results: QuickPickFileItem[]
  query: string
  highlightedIndex: number
  listRef: RefObject<HTMLUListElement | null>
  onHighlightIndex: (index: number) => void
  onSelect: (path: string) => void
}

export function QuickPickFileResultsList({
  results,
  query,
  highlightedIndex,
  listRef,
  onHighlightIndex,
  onSelect,
}: QuickPickFileResultsListProps) {
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
      {results.map((item, index) => (
        <QuickPickFileResultsListItem
          key={item.key}
          item={item}
          query={query}
          highlighted={index === highlightedIndex}
          onMouseEnter={() => onHighlightIndex(index)}
          onClick={() => onSelect(item.key)}
        />
      ))}
    </Box>
  )
}
