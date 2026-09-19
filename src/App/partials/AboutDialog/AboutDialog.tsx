import { useTranslation } from 'react-i18next';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { AppDialog, AppDialogActions, AppDialogContent, AppDialogTitle } from '@/Shared';

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AboutDialog({ open, onClose }: AboutDialogProps) {
  const { t } = useTranslation();

  return (
    <AppDialog open={open} onClose={onClose} maxWidth="xs">
      <AppDialogTitle>{t('about.title')}</AppDialogTitle>
      <AppDialogContent>
        <Stack spacing={1}>
          <Typography variant="body2">{t('app.title')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {t('about.version', { version: __APP_VERSION__ })}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {t('about.commit', { hash: __APP_COMMIT_HASH__ })}
          </Typography>
        </Stack>
      </AppDialogContent>
      <AppDialogActions>
        <Button onClick={onClose}>{t('actions.close')}</Button>
      </AppDialogActions>
    </AppDialog>
  );
}
