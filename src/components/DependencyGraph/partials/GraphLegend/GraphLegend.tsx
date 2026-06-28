import Box from '@mui/material/Box'
import {
  CIRCULAR_EDGE_COLOR,
  INCOMING_EDGE_COLOR,
  OUTGOING_EDGE_COLOR,
  SELECTED_EDGE_COLOR,
} from '../../../../Shared'
import styles from '../../DependencyGraph.module.css'

const solidItems = [
  { color: INCOMING_EDGE_COLOR, label: 'Incoming' },
  { color: OUTGOING_EDGE_COLOR, label: 'Outgoing' },
  { color: CIRCULAR_EDGE_COLOR, label: 'Circular' },
  { color: SELECTED_EDGE_COLOR, label: 'Selected' },
] as const

const dashedItems = [
  {
    label: 'Type-only',
    className: styles.legendLineDashed,
  },
  {
    label: 'Type-only circular',
    className: `${styles.legendLineDashed} ${styles.legendLineDashedTypeOnlyCircular}`,
  },
] as const

export function GraphLegend() {
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
      {solidItems.map(({ color, label }) => (
        <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span className={styles.legendLine} style={{ backgroundColor: color }} />
          <span>{label}</span>
        </Box>
      ))}
      {dashedItems.map(({ label, className }) => (
        <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span className={className} />
          <span>{label}</span>
        </Box>
      ))}
    </Box>
  )
}
