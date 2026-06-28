import type { Theme } from '@mui/material/styles'

export function highlightBaseStyles(theme: Theme) {
  return {
    fontWeight: 600,
    borderRadius: '2px',
    backgroundColor: theme.palette.primary.light
  }
}
