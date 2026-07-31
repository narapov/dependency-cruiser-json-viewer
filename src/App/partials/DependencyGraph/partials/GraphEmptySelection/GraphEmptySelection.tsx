import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';

export function GraphEmptySelection() {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'grid',
        placeItems: 'center',
        height: '100%',
        color: 'text.secondary',
        fontSize: 14,
      }}
    >
      {t('graph.emptySelection')}
    </Box>
  );
}
