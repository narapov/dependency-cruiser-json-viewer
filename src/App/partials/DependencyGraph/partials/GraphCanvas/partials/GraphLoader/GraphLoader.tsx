import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

export function GraphLoader() {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'action.disabledBackground',
        zIndex: 100,
      }}
    >
      <CircularProgress aria-label={t('graph.loading')} />
    </Box>
  );
}
