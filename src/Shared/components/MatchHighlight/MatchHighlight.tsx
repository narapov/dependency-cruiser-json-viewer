import type { ReactNode } from 'react';

import { styled } from '@mui/material/styles';

import { highlightMatchStyles } from '../../helpers/highlightMatchStyles';

const MatchHighlightRoot = styled('span')(({ theme }) => ({
  ...highlightMatchStyles(theme),
  color: theme.palette.text.primary,
}));

/** Styled span for primary-text match highlighting. */
export function MatchHighlight({ children }: { children: ReactNode }) {
  return <MatchHighlightRoot data-testid="match-highlight">{children}</MatchHighlightRoot>;
}
