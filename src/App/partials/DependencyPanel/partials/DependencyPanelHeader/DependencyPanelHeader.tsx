import { useTranslation } from 'react-i18next';

import CloseOutlined from '@mui/icons-material/CloseOutlined';
import DataObjectOutlined from '@mui/icons-material/DataObjectOutlined';
import MyLocationOutlined from '@mui/icons-material/MyLocationOutlined';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { TextWithFloatingActions } from '@/Shared';

interface DependencyPanelHeaderProps {
  path: string;
  onClose: () => void;
  onShowInGraph: (path: string) => void;
  onViewModuleJson: (path: string) => void;
}

export function DependencyPanelHeader(props: DependencyPanelHeaderProps) {
  const { path, onClose, onShowInGraph, onViewModuleJson } = props;

  const { t } = useTranslation();

  return (
    <TextWithFloatingActions
      sx={{ px: 2, py: 1.5, flexShrink: 0 }}
      trailingSx={{ gap: 0.5 }}
      trailing={
        <>
          <Tooltip title={t('actions.showInGraph')}>
            <IconButton color="primary" aria-label={t('actions.showInGraph')} onClick={() => onShowInGraph(path)}>
              <MyLocationOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('moduleJson.view')}>
            <IconButton aria-label={t('moduleJson.view')} onClick={() => onViewModuleJson(path)}>
              <DataObjectOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('actions.close')}>
            <IconButton aria-label={t('actions.close')} onClick={onClose}>
              <CloseOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      }
    >
      <Typography
        component="div"
        sx={{
          fontFamily: 'monospace',
          wordBreak: 'break-all',
        }}
      >
        {path}
      </Typography>
    </TextWithFloatingActions>
  );
}
