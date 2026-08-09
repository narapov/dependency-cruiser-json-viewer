import { useTranslation } from 'react-i18next';

import FolderCopyOutlined from '@mui/icons-material/FolderCopyOutlined';
import RuleOutlined from '@mui/icons-material/RuleOutlined';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import { formatShortcut } from '@/Shared';

import type { SidebarView } from '../../hooks';

export const SIDEBAR_TOGGLE_WIDTH = 32;

interface SidebarToggleProps {
  sidebarOpen: boolean;
  sidebarView: SidebarView;
  onSelectView: (view: SidebarView) => void;
}

export function SidebarToggle({ sidebarOpen, sidebarView, onSelectView }: SidebarToggleProps) {
  const { t } = useTranslation();
  const shortcut = formatShortcut('B');
  const filesActive = sidebarOpen && sidebarView === 'files';
  const rulesActive = sidebarOpen && sidebarView === 'rules';
  const filesLabel = filesActive ? t('app.hideFileTree', { shortcut }) : t('app.showFileTree', { shortcut });
  const rulesLabel = rulesActive ? t('app.hideRules') : t('app.showRules');

  return (
    <Box
      sx={{
        flexShrink: 0,
        width: SIDEBAR_TOGGLE_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.5,
        bgcolor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider',
      }}
    >
      <Tooltip title={filesLabel}>
        <IconButton
          size="small"
          onClick={() => onSelectView('files')}
          aria-label={filesLabel}
          aria-pressed={filesActive}
          sx={{
            mt: 0.5,
            borderRadius: 1,
            ...(filesActive && {
              bgcolor: 'action.selected',
            }),
          }}
        >
          <FolderCopyOutlined sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title={rulesLabel}>
        <IconButton
          size="small"
          onClick={() => onSelectView('rules')}
          aria-label={rulesLabel}
          aria-pressed={rulesActive}
          sx={{
            borderRadius: 1,
            ...(rulesActive && {
              bgcolor: 'action.selected',
            }),
          }}
        >
          <RuleOutlined sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
