import { useMemo } from 'react';

import Box from '@mui/material/Box';

import type { QuickPickCommand } from '../../../../types';
import { computeQuickPickHighlight } from '../../../QuickPickFileResultsList/partials/QuickPickFileResultsListItem/helpers/computeQuickPickHighlight';
import { QuickPickHighlightedText } from '../../../QuickPickFileResultsList/partials/QuickPickFileResultsListItem/partials/QuickPickHighlightedText';
import { QuickPickNameHighlight } from '../../../QuickPickFileResultsList/partials/QuickPickFileResultsListItem/partials/QuickPickNameHighlight';

interface QuickPickCommandResultsListItemProps {
  command: QuickPickCommand;
  query: string;
  highlighted: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}

export function QuickPickCommandResultsListItem({
  command,
  query,
  highlighted,
  onMouseEnter,
  onClick,
}: QuickPickCommandResultsListItemProps) {
  const highlight = useMemo(
    () => computeQuickPickHighlight(query, command.label, command.label),
    [query, command.label],
  );

  return (
    <Box
      component="li"
      role="option"
      aria-selected={highlighted}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        px: 1.5,
        py: 0.75,
        cursor: 'pointer',
        fontSize: 13,
        bgcolor: highlighted ? 'action.selected' : 'transparent',
        '&:hover': {
          bgcolor: highlighted ? 'action.selected' : 'action.hover',
        },
      }}
    >
      <QuickPickHighlightedText
        text={command.label}
        indexes={highlight.nameIndexes}
        Highlight={QuickPickNameHighlight}
      />
    </Box>
  );
}
