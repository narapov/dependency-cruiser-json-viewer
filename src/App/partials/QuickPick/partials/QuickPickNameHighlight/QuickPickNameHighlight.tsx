import { styled } from '@mui/material/styles';

import { highlightBaseStyles } from '../../helpers/highlightBaseStyles';

export const QuickPickNameHighlight = styled('span')(({ theme }) => ({
  ...highlightBaseStyles(theme),
  color: theme.palette.text.primary,
}));
