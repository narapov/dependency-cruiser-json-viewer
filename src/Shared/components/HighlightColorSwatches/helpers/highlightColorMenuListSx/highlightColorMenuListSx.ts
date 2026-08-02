import type { SxProps, Theme } from '@mui/material/styles';

/** List `sx` for a Menu that hosts highlight color swatches. */
export const highlightColorMenuListSx: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 0.5,
  p: 1,
};
