import { useTranslation } from 'react-i18next';

import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import MyLocationOutlined from '@mui/icons-material/MyLocationOutlined';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { copyToClipboard } from '@/Shared';

interface AppStatusBarProps {
  activePath: string | null;
  onFocusActivePath: () => void;
  onShowDependencies: (path: string) => void;
}

export function AppStatusBar({ activePath, onFocusActivePath, onShowDependencies }: AppStatusBarProps) {
  const { t } = useTranslation();
  const hasSelection = activePath != null;
  const label = activePath ?? t('statusBar.noSelection');

  return (
    <Box
      component="footer"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minHeight: 28,
        px: 1,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      {hasSelection && (
        <>
          <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
            <Tooltip title={t('actions.showInGraphAndFileTree')}>
              <IconButton
                size="small"
                aria-label={t('actions.showInGraphAndFileTree')}
                onClick={onFocusActivePath}
                sx={{ p: 0.5 }}
              >
                <MyLocationOutlined sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('actions.viewDependencies')}>
              <IconButton
                size="small"
                aria-label={t('actions.viewDependencies')}
                onClick={() => onShowDependencies(activePath)}
                sx={{ p: 0.5 }}
              >
                <AccountTreeOutlined sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('actions.copyPath')}>
              <IconButton
                size="small"
                aria-label={t('actions.copyPath')}
                onClick={() => void copyToClipboard(activePath)}
                sx={{ p: 0.5 }}
              >
                <ContentCopyOutlined sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Stack>
          <Divider orientation="vertical" flexItem sx={{ my: 0.75 }} />
        </>
      )}
      <Typography
        variant="caption"
        component="span"
        title={activePath ?? undefined}
        sx={{
          flex: 1,
          minWidth: 0,
          fontFamily: 'monospace',
          fontSize: 12,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: hasSelection ? 'text.primary' : 'text.secondary',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
