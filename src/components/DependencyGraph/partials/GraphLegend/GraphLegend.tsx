import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';

import { CIRCULAR_EDGE_COLOR, INCOMING_EDGE_COLOR, OUTGOING_EDGE_COLOR, SELECTED_EDGE_COLOR } from '../../../../Shared';

import styles from '../../DependencyGraph.module.css';

export function GraphLegend() {
  const { t } = useTranslation();

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
        gap: 0.75,
        m: 1.5,
        p: '8px 10px',
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        fontSize: 12,
        pointerEvents: 'none',
      }}
    >
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
  );
}
