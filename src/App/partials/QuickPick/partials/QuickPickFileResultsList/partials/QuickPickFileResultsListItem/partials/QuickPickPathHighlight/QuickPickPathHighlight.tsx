import { styled } from '@mui/material/styles';

import { highlightMatchStyles } from '@/Shared';

export const QuickPickPathHighlight = styled('span')(({ theme }) => ({
  ...highlightMatchStyles(theme),
  color: theme.palette.text.secondary,
}));
