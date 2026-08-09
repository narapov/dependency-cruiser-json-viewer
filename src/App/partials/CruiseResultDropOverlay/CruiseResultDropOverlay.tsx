import { useTranslation } from 'react-i18next';

import FileUploadOffIcon from '@mui/icons-material/FileUploadOff';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface CruiseResultDropOverlayProps {
  open: boolean;
  allowed: boolean;
}

export function CruiseResultDropOverlay({ open, allowed }: CruiseResultDropOverlayProps) {
  const { t } = useTranslation();

  if (!open) {
    return null;
  }

  const Icon = allowed ? UploadFileOutlinedIcon : FileUploadOffIcon;

  return (
    <Box
      aria-hidden
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        pointerEvents: 'none',
        zIndex: theme => theme.zIndex.modal + 100,
        bgcolor: 'action.disabledBackground',
      }}
    >
      <Stack
        spacing={1}
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          mt: 4,
          mb: 1,
          ml: 1,
          mr: 1,
          border: 3,
          borderStyle: 'dashed',
          borderColor: allowed ? 'divider' : 'error.main',
          bgcolor: 'background.paper',
        }}
      >
        <Icon sx={{ fontSize: 48, color: allowed ? 'text.secondary' : 'error.main' }} />
        <Typography component="div" variant="body1" sx={{ px: 2.5, py: 1.5, fontWeight: 'bold', textAlign: 'center' }}>
          {t(allowed ? 'app.dropCruiseResultHint' : 'app.dropCruiseResultInvalidFile')}
        </Typography>
      </Stack>
    </Box>
  );
}
