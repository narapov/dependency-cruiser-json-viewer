import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useColorScheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { THEME_OPTIONS, type ThemeOptionValue } from '../ThemeSelector/themeOptions';

interface ThemePickerDialogProps {
  open: boolean;
  onClose: () => void;
}

function getThemeIndex(mode: ThemeOptionValue | undefined): number {
  if (mode == null) return 0;
  const index = THEME_OPTIONS.findIndex(option => option.value === mode);
  return index === -1 ? 0 : index;
}

export function ThemePickerDialog({ open, onClose }: ThemePickerDialogProps) {
  const { mode, setMode } = useColorScheme();
  const { t } = useTranslation();
  const [highlightedIndex, setHighlightedIndex] = useState(() => getThemeIndex(mode));
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setHighlightedIndex(getThemeIndex(mode));
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;

    const highlighted = listRef.current?.children[highlightedIndex];
    if (highlighted instanceof HTMLElement) {
      highlighted.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, open]);

  const focusList = () => {
    requestAnimationFrame(() => {
      containerRef.current?.focus();
    });
  };

  const handleSelect = (value: ThemeOptionValue) => {
    setMode(value);
    onClose();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex(index => Math.min(index + 1, THEME_OPTIONS.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex(index => Math.max(index - 1, 0));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const option = THEME_OPTIONS[highlightedIndex];
      if (option) handleSelect(option.value);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      sx={{ '& .MuiDialog-container': { alignItems: 'flex-start', pt: '12vh' } }}
      slotProps={{ transition: { onEntered: focusList } }}
    >
      <DialogTitle sx={{ pb: 1, fontSize: 16 }}>{t('theme.setTheme')}</DialogTitle>
      <DialogContent sx={{ p: 0, pb: 1 }}>
        <Box ref={containerRef} tabIndex={0} onKeyDown={handleKeyDown} sx={{ outline: 'none' }}>
          <Box
            component="ul"
            ref={listRef}
            role="listbox"
            aria-label={t('theme.themeOptions')}
            sx={{
              m: 0,
              py: 0.5,
              px: 0,
              listStyle: 'none',
            }}
          >
            {THEME_OPTIONS.map((option, index) => {
              const isActive = mode === option.value;
              const highlighted = index === highlightedIndex;

              return (
                <Box
                  key={option.value}
                  component="li"
                  role="option"
                  aria-selected={highlighted}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => handleSelect(option.value)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    py: 0.75,
                    cursor: 'pointer',
                    fontSize: 13,
                    bgcolor: highlighted ? 'action.selected' : 'transparent',
                    fontWeight: isActive ? 600 : 400,
                    '&:hover': {
                      bgcolor: highlighted ? 'action.selected' : 'action.hover',
                    },
                  }}
                >
                  <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}>
                    {t(option.labelKey)}
                  </Typography>
                  {isActive && (
                    <Typography component="span" sx={{ ml: 1, fontSize: 'inherit', color: 'text.secondary' }}>
                      {t('theme.active')}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
