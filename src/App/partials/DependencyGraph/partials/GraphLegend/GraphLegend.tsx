import { useTranslation } from 'react-i18next';
import { useLocalStorage } from 'react-use';

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import {
  appStorageKey,
  CIRCULAR_EDGE_COLOR,
  INCOMING_EDGE_COLOR,
  OUTGOING_EDGE_COLOR,
  SELECTED_EDGE_COLOR,
} from '@/Shared';

import styles from './GraphLegend.module.css';

const STORAGE_KEY = appStorageKey('graph-legend-expanded');

export function GraphLegend() {
  const { t } = useTranslation();
  const [storedExpanded, setExpanded] = useLocalStorage<boolean>(STORAGE_KEY, true);
  const expanded = storedExpanded ?? true;

  const solidItems = [
    { color: INCOMING_EDGE_COLOR, labelKey: 'graph.legend.incoming' },
    { color: OUTGOING_EDGE_COLOR, labelKey: 'graph.legend.outgoing' },
    { color: CIRCULAR_EDGE_COLOR, labelKey: 'graph.legend.circular' },
    { color: SELECTED_EDGE_COLOR, labelKey: 'graph.legend.selected' },
  ] as const;

  const dashedItems = [
    {
      labelKey: 'graph.legend.typeOnly',
      className: styles.legendLineDashed,
    },
    {
      labelKey: 'graph.legend.typeOnlyCircular',
      className: `${styles.legendLineDashed} ${styles.legendLineDashedTypeOnlyCircular}`,
    },
  ] as const;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        fontSize: 12,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: '10px',
          py: '4px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setExpanded(!expanded)}
        role="button"
        aria-expanded={expanded}
        aria-label={expanded ? t('actions.collapse') : t('actions.expand')}
      >
        <Typography component="span" sx={{ flex: 1, fontSize: 12, fontWeight: 500 }}>
          {t('graph.legend.title')}
        </Typography>
        <IconButton size="small" aria-hidden tabIndex={-1} sx={{ width: 24, height: 24, pointerEvents: 'none' }}>
          {expanded ? <ExpandMoreIcon sx={{ fontSize: 16 }} /> : <ChevronRightIcon sx={{ fontSize: 16 }} />}
        </IconButton>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, px: '10px', pb: '8px' }}>
          {solidItems.map(({ color, labelKey }) => (
            <Box key={labelKey} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span className={styles.legendLine} style={{ backgroundColor: color }} />
              <span>{t(labelKey)}</span>
            </Box>
          ))}
          {dashedItems.map(({ labelKey, className }) => (
            <Box key={labelKey} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span className={className} />
              <span>{t(labelKey)}</span>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}
