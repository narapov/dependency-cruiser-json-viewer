import Box from '@mui/material/Box';

const pathSx = {
  display: 'block',
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  direction: 'rtl',
  textAlign: 'left',
  fontFamily: 'monospace',
  fontSize: 12,
} as const;

interface EdgeContextMenuHeaderProps {
  source: string;
  target: string;
}

export function EdgeContextMenuHeader({ source, target }: EdgeContextMenuHeaderProps) {
  return (
    <Box
      role="presentation"
      sx={{
        display: 'grid',
        gridTemplateColumns: 'auto auto auto',
        alignItems: 'center',
        columnGap: 0.5,
        px: 2,
        pt: 1,
        pb: 0.5,
        whiteSpace: 'nowrap',
      }}
    >
      <Box component="span" sx={{ ...pathSx, minWidth: 0 }} title={source}>
        {source}
      </Box>
      <Box
        aria-hidden
        sx={{
          color: 'text.secondary',
          fontSize: 12,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        →
      </Box>
      <Box component="span" sx={{ ...pathSx, minWidth: 0 }} title={target}>
        {target}
      </Box>
    </Box>
  );
}
