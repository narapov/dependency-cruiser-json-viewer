import { FolderOutlined } from '@ant-design/icons'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { FolderNodeData } from '../../lib/dependencyGraph/types'
import styles from './DependencyGraph.module.css'

export function FolderNode({ data }: NodeProps) {
  const { label, path, expanded, highlighted, onToggle } = data as FolderNodeData

  return (
    <div className={`${styles.node} ${highlighted ? styles.highlighted : ''}`}>
      <Handle type="target" position={Position.Left} />
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
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
