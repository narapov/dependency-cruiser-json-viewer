import { useMemo } from 'react';

import Box from '@mui/material/Box';

import { HighlightedMatchText, MatchHighlight } from '@/Shared';

import { computeQuickPickHighlight } from '../../../../helpers/computeQuickPickHighlight';
import type { QuickPickCommand } from '../../../../types';

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
  const disabled = Boolean(command.disabled);
  const selectedBg = highlighted && !disabled ? 'action.selected' : 'transparent';
  let hoverBg: 'transparent' | 'action.selected' | 'action.hover' = 'action.hover';
  if (disabled) {
    hoverBg = 'transparent';
  } else if (highlighted) {
    hoverBg = 'action.selected';
  }

  return (
    <Box
      component="li"
      role="option"
      aria-selected={highlighted}
      aria-disabled={disabled || undefined}
      onMouseEnter={disabled ? undefined : onMouseEnter}
      onClick={disabled ? undefined : onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        px: 1.5,
        py: 0.75,
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 13,
        opacity: disabled ? 0.5 : 1,
        bgcolor: selectedBg,
        '&:hover': {
          bgcolor: hoverBg,
        },
      }}
    >
      <HighlightedMatchText text={command.label} indexes={highlight.nameIndexes} Highlight={MatchHighlight} />
    </Box>
  );
}
