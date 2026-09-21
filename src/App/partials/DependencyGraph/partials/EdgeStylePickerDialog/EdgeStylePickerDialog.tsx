import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { GraphEdgeStyle } from '@/domain';
import { AppDialog, AppDialogContent, AppDialogTitle } from '@/Shared';

const EDGE_STYLE_OPTIONS: { value: GraphEdgeStyle; labelKey: string }[] = [
  { value: 'bezier', labelKey: 'graph.edgeStyleBezier' },
  { value: 'orthogonal', labelKey: 'graph.edgeStyleOrthogonal' },
  { value: 'straight', labelKey: 'graph.edgeStyleStraight' },
];

interface EdgeStylePickerDialogProps {
  open: boolean;
  edgeStyle: GraphEdgeStyle;
  onEdgeStyleChange: (edgeStyle: GraphEdgeStyle) => void;
  onClose: () => void;
}

function getEdgeStyleIndex(edgeStyle: GraphEdgeStyle): number {
  const index = EDGE_STYLE_OPTIONS.findIndex(option => option.value === edgeStyle);
  return index === -1 ? 0 : index;
}

export function EdgeStylePickerDialog(props: EdgeStylePickerDialogProps) {
  const { open, edgeStyle, onEdgeStyleChange, onClose } = props;

  const { t } = useTranslation();
  const [highlightedIndex, setHighlightedIndex] = useState(() => getEdgeStyleIndex(edgeStyle));
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const focusList = () => {
    setHighlightedIndex(getEdgeStyleIndex(edgeStyle));
    requestAnimationFrame(() => {
      containerRef.current?.focus();
    });
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const highlighted = listRef.current?.children[highlightedIndex];
    if (highlighted instanceof HTMLElement) {
      highlighted.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, open]);

  const handleSelect = (value: GraphEdgeStyle) => {
    onEdgeStyleChange(value);
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
      setHighlightedIndex(index => Math.min(index + 1, EDGE_STYLE_OPTIONS.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex(index => Math.max(index - 1, 0));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const option = EDGE_STYLE_OPTIONS[highlightedIndex];
      if (option) {
        handleSelect(option.value);
      }
    }
  };

  return (
    <AppDialog open={open} onClose={onClose} maxWidth="xs" slotProps={{ transition: { onEntered: focusList } }}>
      <AppDialogTitle>{t('graph.setEdgeStyle')}</AppDialogTitle>
      <AppDialogContent sx={{ p: 0, pb: 1 }}>
        <Box ref={containerRef} tabIndex={0} onKeyDown={handleKeyDown} sx={{ outline: 'none' }}>
          <Box
            component="ul"
            ref={listRef}
            role="listbox"
            aria-label={t('graph.edgeStyleOptions')}
            sx={{
              m: 0,
              py: 0.5,
              px: 0,
              listStyle: 'none',
            }}
          >
            {EDGE_STYLE_OPTIONS.map((option, index) => {
              const isActive = edgeStyle === option.value;
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
                      {t('graph.edgeStyleActive')}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      </AppDialogContent>
    </AppDialog>
  );
}
