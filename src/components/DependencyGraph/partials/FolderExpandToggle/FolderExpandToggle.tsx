import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import IconButton from '@mui/material/IconButton';

interface FolderExpandToggleProps {
  expanded: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function FolderExpandToggle({ expanded, onClick }: FolderExpandToggleProps) {
  const { t } = useTranslation();

  return (
    <IconButton
      size="small"
      aria-label={expanded ? t('actions.collapseFolder') : t('actions.expandFolder')}
      onClick={onClick}
      sx={{
        width: 16,
        height: 16,
      }}
    >
      {expanded ? <ExpandMoreIcon sx={{ fontSize: 14 }} /> : <ChevronRightIcon sx={{ fontSize: 14 }} />}
    </IconButton>
  );
}
