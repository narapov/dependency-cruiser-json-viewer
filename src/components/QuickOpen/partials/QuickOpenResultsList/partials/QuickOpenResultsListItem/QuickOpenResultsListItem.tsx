import { FileOutlined, FolderOutlined } from '@ant-design/icons'
import { useMemo, type ReactNode } from 'react'
import type { QuickOpenResultItem } from '../../../../QuickOpen.types'
import styles from '../../../../QuickOpen.module.css'
import { computeQuickOpenHighlight } from './helpers/computeQuickOpenHighlight'

interface QuickOpenResultsListItemProps {
  item: QuickOpenResultItem
  query: string
  highlighted: boolean
  onMouseEnter: () => void
  onClick: () => void
}

function getParentPath(key: string): string | null {
  const lastSlash = key.lastIndexOf('/')
  if (lastSlash === -1) return null
  return key.slice(0, lastSlash)
}

function renderHighlighted(text: string, indexes: number[], className: string): ReactNode {
  if (indexes.length === 0) {
    return text
  }

  const sorted = [...indexes].sort((a, b) => a - b)
  const segments: ReactNode[] = []
  let position = 0

  for (let index = 0; index < sorted.length; index++) {
    const start = sorted[index]
    let end = start + 1
    while (index + 1 < sorted.length && sorted[index + 1] === end) {
      end++
      index++
    }

    if (position < start) {
      segments.push(text.slice(position, start))
    }
    segments.push(
      <span key={start} className={className}>
        {text.slice(start, end)}
      </span>,
    )
    position = end
  }

  if (position < text.length) {
    segments.push(text.slice(position))
  }

  return <>{segments}</>
}

export function QuickOpenResultsListItem({
  item,
  query,
  highlighted,
  onMouseEnter,
  onClick,
}: QuickOpenResultsListItemProps) {
  const parentPath = getParentPath(item.key)
  const { nameIndexes, pathIndexes } = useMemo(
    () => computeQuickOpenHighlight(query, item.name, item.key),
    [query, item.name, item.key],
  )

  return (
    <li
      className={`${styles.item} ${highlighted ? styles.itemHighlighted : ''}`}
      role="option"
      aria-selected={highlighted}
      onMouseEnter={onMouseEnter}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      <span className={styles.icon}>
        {item.isFolder ? <FolderOutlined /> : <FileOutlined />}
      </span>
      <span className={styles.name}>
        {renderHighlighted(item.name, nameIndexes, styles.match)}
      </span>
      {parentPath && (
        <span className={styles.path}>
          {renderHighlighted(parentPath, pathIndexes, styles.pathMatch)}
        </span>
      )}
    </li>
  )
}
