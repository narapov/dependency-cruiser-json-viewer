import type { Theme } from '@mui/material/styles';

/** Theme-aware CSS for match highlight spans. */
export function highlightMatchStyles(theme: Theme) {
  return {
    fontWeight: 600,
    borderRadius: '2px',
    backgroundColor: theme.palette.primary.light,
  };
}
