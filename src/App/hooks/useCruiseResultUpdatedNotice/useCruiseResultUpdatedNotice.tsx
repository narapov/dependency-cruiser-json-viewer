import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

interface UseCruiseResultUpdatedNoticeOptions {
  data: unknown;
  cruiseWatchEnabled: boolean;
}

/**
 * Watch-mode snackbar that opens when cruise result data changes after the first load.
 */
export function useCruiseResultUpdatedNotice(config: UseCruiseResultUpdatedNoticeOptions) {
  const { data, cruiseWatchEnabled } = config;

  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const isInitialCruiseResult = useRef(true);

  useEffect(() => {
    if (!cruiseWatchEnabled || data == null) {
      return;
    }
    if (isInitialCruiseResult.current) {
      isInitialCruiseResult.current = false;
      return;
    }
    setOpen(true);
  }, [data, cruiseWatchEnabled]);

  const notice: ReactNode = (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert severity="success" onClose={() => setOpen(false)} sx={{ width: '100%' }}>
        {t('app.cruiseResultUpdated')}
      </Alert>
    </Snackbar>
  );

  return { notice, open };
}
