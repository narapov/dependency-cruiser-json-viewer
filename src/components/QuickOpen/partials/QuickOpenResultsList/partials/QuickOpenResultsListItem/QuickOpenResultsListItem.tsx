import Box from '@mui/material/Box'
import { getParentPath } from '../../../../../../domain'
import { MaterialFileSystemIcon } from '../../../../../../Shared'
import { useMemo } from 'react'
import type { QuickOpenResultItem } from '../../../../QuickOpen.types'
import { computeQuickOpenHighlight } from './helpers/computeQuickOpenHighlight'
import { QuickOpenHighlightedText } from './partials/QuickOpenHighlightedText'
import { QuickOpenNameHighlight } from './partials/QuickOpenNameHighlight'
import { QuickOpenPathHighlight } from './partials/QuickOpenPathHighlight'

interface QuickOpenResultsListItemProps {
  item: QuickOpenResultItem
  query: string
  highlighted: boolean
  onMouseEnter: () => void
  onClick: () => void
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
    <Box
      component="li"
      role="option"
      aria-selected={highlighted}
      onMouseEnter={onMouseEnter}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 0.75,
        cursor: 'pointer',
        fontSize: 13,
        lineHeight: '20px',
        bgcolor: highlighted ? 'action.selected' : 'transparent',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      <Box component="span" sx={{ flexShrink: 0, color: 'text.secondary', fontSize: 14 }}>
        <MaterialFileSystemIcon name={item.name} isFolder={item.isFolder} />
      </Box>
      <QuickOpenHighlightedText
        text={item.name}
        indexes={nameIndexes}
        Highlight={QuickOpenNameHighlight}
        sx={{ flexShrink: 0, color: 'text.primary' }}
      />
      {parentPath && (
        <QuickOpenHighlightedText
          text={parentPath}
          indexes={pathIndexes}
          Highlight={QuickOpenPathHighlight}
          sx={{
            minWidth: 0,
            overflow: 'hidden',
            color: 'text.secondary',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        />
      )}
    </Box>
  )
}
