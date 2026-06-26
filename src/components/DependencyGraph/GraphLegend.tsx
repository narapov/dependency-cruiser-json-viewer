import { CIRCULAR_EDGE_COLOR, INCOMING_EDGE_COLOR, OUTGOING_EDGE_COLOR } from '../../lib/dependencyGraph/buildGraph'
import styles from './DependencyGraph.module.css'

const items = [
  { color: INCOMING_EDGE_COLOR, label: 'Incoming' },
  { color: OUTGOING_EDGE_COLOR, label: 'Outgoing' },
  { color: CIRCULAR_EDGE_COLOR, label: 'Circular' },
] as const

export function GraphLegend() {
  return (
    <div className={styles.legend}>
      {items.map(({ color, label }) => (
        <div key={label} className={styles.legendItem}>
          <span className={styles.legendLine} style={{ backgroundColor: color }} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}
