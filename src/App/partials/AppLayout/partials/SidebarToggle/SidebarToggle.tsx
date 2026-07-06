import { useTranslation } from 'react-i18next';

import FolderCopyOutlined from '@mui/icons-material/FolderCopyOutlined';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import { formatShortcut } from '@/Shared';

export const SIDEBAR_TOGGLE_WIDTH = 32;

interface SidebarToggleProps {
  sidebarOpen: boolean;
  onToggle: () => void;
}

export function SidebarToggle({ sidebarOpen, onToggle }: SidebarToggleProps) {
  const { t } = useTranslation();
  const shortcut = formatShortcut('B');
  const label = sidebarOpen ? t('app.hideFileTree', { shortcut }) : t('app.showFileTree', { shortcut });

  return (
    <Box
      sx={{
        flexShrink: 0,
        width: SIDEBAR_TOGGLE_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider',
      }}
    >
      <Tooltip title={label}>
        <IconButton
          size="small"
          onClick={onToggle}
          aria-label={label}
          aria-expanded={sidebarOpen}
          sx={{
            mt: 0.5,
            borderRadius: 1,
            ...(sidebarOpen && {
              bgcolor: 'action.selected',
            }),
          }}
        >
          <FolderCopyOutlined sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
