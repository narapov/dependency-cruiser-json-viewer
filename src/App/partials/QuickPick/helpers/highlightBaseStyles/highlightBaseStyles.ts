import type { Theme } from '@mui/material/styles';

/** Theme-aware CSS for quick-pick match highlight spans. */
export function highlightBaseStyles(theme: Theme) {
  return {
    fontWeight: 600,
    borderRadius: '2px',
    backgroundColor: theme.palette.primary.light,
  };
}
