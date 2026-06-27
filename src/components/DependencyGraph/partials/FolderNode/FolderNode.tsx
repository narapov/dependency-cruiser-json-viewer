import FolderOutlined from '@mui/icons-material/FolderOutlined'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { CIRCULAR_NODE_BACKGROUND } from '../../../../Shared'
import type { FolderNodeData } from '../../DependencyGraph.types'
import styles from '../../DependencyGraph.module.css'
import { NodeContextMenu } from '../NodeContextMenu'

export function FolderNode({ data }: NodeProps) {
  const { label, path, expanded, highlighted, circular, backgroundColor, onToggle, onExpandRecursive, onShowInFileTree, onShowDependencies } =
    data as FolderNodeData

  return (
    <NodeContextMenu
      path={path}
      isFolder
      expanded={expanded}
      onToggle={onToggle}
      onExpandRecursive={onExpandRecursive}
      onShowInFileTree={onShowInFileTree}
      onShowDependencies={onShowDependencies}
    >
      <div
        className={`${styles.node} ${highlighted ? styles.highlighted : ''} ${circular ? styles.circular : ''}`}
        style={{ backgroundColor: circular ? CIRCULAR_NODE_BACKGROUND : backgroundColor }}
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
        <FolderOutlined className={styles.icon} fontSize="inherit" />
        <span className={styles.label}>{label}</span>
        <Handle type="source" position={Position.Right} />
      </div>
    </NodeContextMenu>
  )
}
