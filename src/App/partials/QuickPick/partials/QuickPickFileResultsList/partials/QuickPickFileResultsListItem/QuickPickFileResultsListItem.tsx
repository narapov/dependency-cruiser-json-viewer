import { useMemo } from 'react';

import Box from '@mui/material/Box';

import { getParentPath } from '@/domain';
import { HighlightedMatchText, MatchHighlight, MaterialFileSystemIcon } from '@/Shared';

import { computeQuickPickHighlight } from '../../../../helpers/computeQuickPickHighlight';
import type { QuickPickFileItem } from '../../../../types';
import { QuickPickPathHighlight } from './partials/QuickPickPathHighlight';

interface QuickPickFileResultsListItemProps {
  item: QuickPickFileItem;
  query: string;
  highlighted: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}

export function QuickPickFileResultsListItem({
  item,
  query,
  highlighted,
  onMouseEnter,
  onClick,
}: QuickPickFileResultsListItemProps) {
  const parentPath = getParentPath(item.key);
  const { nameIndexes, pathIndexes } = useMemo(
    () => computeQuickPickHighlight(query, item.name, item.key),
    [query, item.name, item.key],
  );

  return (
    <Box
      component="li"
      role="option"
      aria-selected={highlighted}
      onMouseEnter={onMouseEnter}
      onMouseDown={event => event.preventDefault()}
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
      <HighlightedMatchText
        text={item.name}
        indexes={nameIndexes}
        Highlight={MatchHighlight}
        sx={{ flexShrink: 0, color: 'text.primary' }}
      />
      {parentPath && (
        <HighlightedMatchText
          text={parentPath}
          indexes={pathIndexes}
          Highlight={QuickPickPathHighlight}
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
  );
}
