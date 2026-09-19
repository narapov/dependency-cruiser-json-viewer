import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import MoreVertIcon from '@mui/icons-material/MoreVert';
import IconButton from '@mui/material/IconButton';

import { useNodeContextMenuControls } from '../../contexts';

export function NodeContextMenuTrigger() {
  const { t } = useTranslation();
  const { openAtElement } = useNodeContextMenuControls();

  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    openAtElement(event.currentTarget);
  };

  return (
    <IconButton
      size="small"
      className="nodrag nopan"
      aria-label={t('actions.openNodeMenu')}
      onClick={onClick}
      sx={{
        width: 16,
        height: 16,
        flexShrink: 0,
      }}
    >
      <MoreVertIcon sx={{ fontSize: 14 }} />
    </IconButton>
  );
}
