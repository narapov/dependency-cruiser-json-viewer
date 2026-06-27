import type { RefObject } from 'react'
import type { SearchableNode } from '../../../../lib/searchTreeNodes'
import styles from '../../QuickOpen.module.css'
import { QuickOpenResultsListItem } from './components/QuickOpenResultsListItem'

interface QuickOpenResultsListProps {
  results: SearchableNode[]
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
