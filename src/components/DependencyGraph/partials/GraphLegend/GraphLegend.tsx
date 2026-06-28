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
    style: undefined,
  },
  {
    label: 'Type-only circular',
    className: `${styles.legendLineDashed} ${styles.legendLineDashedTypeOnlyCircular}`,
    style: undefined,
  },
] as const

export function GraphLegend() {
  return (
    <div className={styles.legend}>
      {solidItems.map(({ color, label }) => (
        <div key={label} className={styles.legendItem}>
          <span className={styles.legendLine} style={{ backgroundColor: color }} />
          <span>{label}</span>
        </div>
      ))}
      {dashedItems.map(({ label, className }) => (
        <div key={label} className={styles.legendItem}>
          <span className={className} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}
