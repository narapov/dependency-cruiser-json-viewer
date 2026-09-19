import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

interface TextWithFloatingActionsProps {
  children: ReactNode;
  trailing: ReactNode;
  leading?: ReactNode;
  className?: string;
  sx?: SxProps<Theme>;
  trailingClassName?: string;
  trailingSx?: SxProps<Theme>;
}

/** Merge a base style object with an optional MUI `sx` prop into one `sx` value. */
function mergeSx(base: Record<string, unknown>, sx?: SxProps<Theme>): SxProps<Theme> {
  if (sx == null) {
    return base;
  }
  if (Array.isArray(sx)) {
    return [base, ...sx] as SxProps<Theme>;
  }
  return [base, sx] as SxProps<Theme>;
}

/**
 * Layout where trailing actions float to the right so wrapping text flows underneath them
 * instead of staying in a narrow flex column beside a full-height action column.
 */
export function TextWithFloatingActions({
  children,
  trailing,
  leading,
  className,
  sx,
  trailingClassName,
  trailingSx,
}: TextWithFloatingActionsProps) {
  return (
    <Box
      className={className}
      sx={mergeSx(
        {
          display: 'flex',
          alignItems: 'flex-start',
          gap: 0.25,
          minWidth: 0,
        },
        sx,
      )}
    >
      {leading}
      <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <Box
          className={trailingClassName}
          sx={mergeSx(
            {
              float: 'right',
              display: 'flex',
              alignItems: 'center',
              ml: 0.5,
              gap: 0.25,
            },
            trailingSx,
          )}
        >
          {trailing}
        </Box>
        {children}
      </Box>
    </Box>
  );
}
