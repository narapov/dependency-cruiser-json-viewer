import type { RefObject } from 'react'
import type { QuickOpenResultItem } from '../../QuickOpen.types'
import styles from '../../QuickOpen.module.css'
import { QuickOpenResultsListItem } from './partials/QuickOpenResultsListItem'

interface QuickOpenResultsListProps {
  results: QuickOpenResultItem[]
  query: string
  highlightedIndex: number
  listRef: RefObject<HTMLUListElement | null>
  onHighlightIndex: (index: number) => void
  onSelect: (path: string) => void
}

export function QuickOpenResultsList({
  results,
  query,
  highlightedIndex,
  listRef,
  onHighlightIndex,
  onSelect,
}: QuickOpenResultsListProps) {
  return (
    <ul ref={listRef} className={styles.list} role="listbox">
      {results.map((item, index) => (
        <QuickOpenResultsListItem
          key={item.key}
          item={item}
          query={query}
          highlighted={index === highlightedIndex}
          onMouseEnter={() => onHighlightIndex(index)}
          onClick={() => onSelect(item.key)}
        />
      ))}
    </ul>
  )
}
