import { useCallback, useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import { highlightColorMenuListSx, HighlightColorSwatches } from '../HighlightColorSwatches';

interface EdgeHighlightSubmenuProps {
  currentHighlight: string | undefined;
  onSetHighlight: (color: string | null) => void;
  onClose: () => void;
}

/** Nested “Highlight” submenu with a color swatch grid. */
export function EdgeHighlightSubmenu({ currentHighlight, onSetHighlight, onClose }: EdgeHighlightSubmenuProps) {
  const { t } = useTranslation();
  const [submenuAnchor, setSubmenuAnchor] = useState<HTMLElement | null>(null);

  const handleSubmenuClose = useCallback(() => {
    setSubmenuAnchor(null);
  }, []);

  const handleSelect = useCallback(
    (color: string | null) => {
      handleSubmenuClose();
      onClose();
      onSetHighlight(color);
    },
    [handleSubmenuClose, onClose, onSetHighlight],
  );

  return (
    <>
      <MenuItem
        onMouseEnter={event => setSubmenuAnchor(event.currentTarget)}
        onClick={(event: MouseEvent) => event.stopPropagation()}
        aria-haspopup="true"
      >
        <ListItemText>{t('actions.highlight')}</ListItemText>
        <ChevronRightIcon fontSize="small" sx={{ ml: 2, color: 'text.secondary' }} />
      </MenuItem>
      <Menu
        anchorEl={submenuAnchor}
        open={submenuAnchor != null}
        onClose={handleSubmenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          list: {
            onMouseLeave: handleSubmenuClose,
            sx: highlightColorMenuListSx,
          },
        }}
      >
        <HighlightColorSwatches currentHighlight={currentHighlight} onSelect={handleSelect} />
      </Menu>
    </>
  );
}
