import { FolderOutlined } from '@ant-design/icons'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { FolderNodeData } from '../../lib/dependencyGraph/types'
import styles from './DependencyGraph.module.css'
import { NodeContextMenu } from './NodeContextMenu'

export function FolderNode({ data }: NodeProps) {
  const { label, path, expanded, highlighted, backgroundColor, onToggle, onShowInFileTree } =
    data as FolderNodeData

  return (
    <NodeContextMenu
      path={path}
      isFolder
      expanded={expanded}
      onToggle={onToggle}
      onShowInFileTree={onShowInFileTree}
    >
      <div
        className={`${styles.node} ${highlighted ? styles.highlighted : ''}`}
        style={{ backgroundColor }}
      >
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
    </NodeContextMenu>
  )
}
