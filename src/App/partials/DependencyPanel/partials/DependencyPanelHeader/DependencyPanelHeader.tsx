import { useTranslation } from 'react-i18next';

import CloseOutlined from '@mui/icons-material/CloseOutlined';
import MyLocationOutlined from '@mui/icons-material/MyLocationOutlined';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

interface DependencyPanelHeaderProps {
  path: string;
  onClose: () => void;
  onShowInGraph: (path: string) => void;
}

export function DependencyPanelHeader({ path, onClose, onShowInGraph }: DependencyPanelHeaderProps) {
  const { t } = useTranslation();

  return (
    <Stack direction="row" spacing={1} sx={{ px: 2, py: 1.5, flexShrink: 0, alignItems: 'flex-start' }}>
      <Typography
        component="div"
        sx={{
          flex: 1,
          minWidth: 0,
          fontFamily: 'monospace',
          wordBreak: 'break-all',
        }}
      >
        {path}
      </Typography>
      <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
        <Tooltip title={t('actions.showInGraph')}>
          <IconButton color="primary" aria-label={t('actions.showInGraph')} onClick={() => onShowInGraph(path)}>
            <MyLocationOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('actions.close')}>
          <IconButton aria-label={t('actions.close')} onClick={onClose}>
            <CloseOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  );
}
