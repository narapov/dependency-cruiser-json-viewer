import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import CheckIcon from '@mui/icons-material/Check';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';

import { USER_EDGE_HIGHLIGHT_COLORS } from '../../helpers/graphTheme';

interface HighlightColorSwatchesProps {
  currentHighlight: string | undefined;
  onSelect: (color: string | null) => void;
}

/** Color swatch menu items for user edge highlighting. */
export function HighlightColorSwatches({ currentHighlight, onSelect }: HighlightColorSwatchesProps) {
  const { t } = useTranslation();

  const handleSelect = (color: string | null) => (event: MouseEvent) => {
    event.stopPropagation();
    onSelect(color);
  };

  return (
    <>
      {USER_EDGE_HIGHLIGHT_COLORS.map(color => (
        <MenuItem key={color} onClick={handleSelect(color)} sx={{ p: 0.5, minHeight: 0, justifyContent: 'center' }}>
          <Box
            sx={{
              position: 'relative',
              width: 16,
              height: 16,
              borderRadius: '2px',
              backgroundColor: color,
              border: '1px solid rgba(0, 0, 0, 0.2)',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {currentHighlight === color && (
              <CheckIcon sx={{ fontSize: 14, color: 'common.white', filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.8))' }} />
            )}
          </Box>
        </MenuItem>
      ))}
      {currentHighlight != null && (
        <MenuItem onClick={handleSelect(null)} sx={{ gridColumn: '1 / -1', justifyContent: 'center', mt: 0.5 }}>
          {t('actions.clear')}
        </MenuItem>
      )}
    </>
  );
}
