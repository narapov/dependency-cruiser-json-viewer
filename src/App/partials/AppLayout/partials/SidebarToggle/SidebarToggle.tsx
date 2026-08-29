import { useTranslation } from 'react-i18next';

import ColorizeOutlined from '@mui/icons-material/ColorizeOutlined';
import FolderCopyOutlined from '@mui/icons-material/FolderCopyOutlined';
import LoopOutlined from '@mui/icons-material/LoopOutlined';
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
  const hideShortcut = formatShortcut('B');
  const filesShowShortcut = formatShortcut('E', { shift: true });
  const rulesShowShortcut = formatShortcut('M', { shift: true });
  const circularShowShortcut = formatShortcut('C', { shift: true });
  const highlightsShowShortcut = formatShortcut('H', { shift: true });
  const filesActive = sidebarOpen && sidebarView === 'files';
  const rulesActive = sidebarOpen && sidebarView === 'rules';
  const circularActive = sidebarOpen && sidebarView === 'circular';
  const highlightsActive = sidebarOpen && sidebarView === 'highlights';
  const filesLabel = filesActive
    ? t('app.hideFileTree', { shortcut: hideShortcut })
    : t('app.showFileTree', { shortcut: filesShowShortcut });
  const rulesLabel = rulesActive
    ? t('app.hideRules', { shortcut: hideShortcut })
    : t('app.showRules', { shortcut: rulesShowShortcut });
  const circularLabel = circularActive
    ? t('app.hideCircular', { shortcut: hideShortcut })
    : t('app.showCircular', { shortcut: circularShowShortcut });
  const highlightsLabel = highlightsActive
    ? t('app.hideHighlights', { shortcut: hideShortcut })
    : t('app.showHighlights', { shortcut: highlightsShowShortcut });

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
      <Tooltip title={circularLabel}>
        <IconButton
          size="small"
          onClick={() => onSelectView('circular')}
          aria-label={circularLabel}
          aria-pressed={circularActive}
          sx={{
            borderRadius: 1,
            ...(circularActive && {
              bgcolor: 'action.selected',
            }),
          }}
        >
          <LoopOutlined sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title={highlightsLabel}>
        <IconButton
          size="small"
          onClick={() => onSelectView('highlights')}
          aria-label={highlightsLabel}
          aria-pressed={highlightsActive}
          sx={{
            borderRadius: 1,
            ...(highlightsActive && {
              bgcolor: 'action.selected',
            }),
          }}
        >
          <ColorizeOutlined sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
