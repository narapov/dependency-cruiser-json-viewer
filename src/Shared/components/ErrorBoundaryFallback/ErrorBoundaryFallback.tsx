import type { FallbackProps } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/** MUI fallback UI for react-error-boundary. */
export function ErrorBoundaryFallback({ error }: FallbackProps) {
  const { t } = useTranslation();
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  return (
    <Stack
      spacing={2}
      sx={{
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Alert severity="error" sx={{ maxWidth: 640, width: '100%' }}>
        <AlertTitle>{t('app.errorBoundaryTitle')}</AlertTitle>
        {t('app.errorBoundaryMessage')}
        <Typography
          component="pre"
          variant="body2"
          sx={{
            mt: 1.5,
            mb: 0,
            maxHeight: 320,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          }}
        >
          {stack ?? message}
        </Typography>
      </Alert>
      <Button variant="contained" onClick={() => window.location.reload()}>
        {t('app.errorBoundaryReload')}
      </Button>
    </Stack>
  );
}
