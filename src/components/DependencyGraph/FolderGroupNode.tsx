import { FolderOutlined } from '@ant-design/icons'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { FolderGroupNodeData } from '../../lib/dependencyGraph/types'
import styles from './DependencyGraph.module.css'

export function FolderGroupNode({ data }: NodeProps) {
  const { label, path, expanded, highlighted, onToggle } = data as FolderGroupNodeData

  return (
    <div className={`${styles.group} ${highlighted ? styles.groupHighlighted : ''}`}>
      <Handle type="target" position={Position.Left} className={styles.groupHandle} />
      <div className={styles.groupHeader}>
        <button
          type="button"
          className={styles.toggle}
          aria-label={expanded ? 'Collapse folder' : 'Expand folder'}
          onClick={(e) => {
            e.stopPropagation()
            onToggle(path)
          }}
        >
          {expanded ? '▼' : '▶'}
        </button>
        <FolderOutlined className={styles.icon} />
        <span className={styles.label}>{label}</span>
      </div>
      <Handle type="source" position={Position.Right} className={styles.groupHandle} />
    </div>
  )
}
