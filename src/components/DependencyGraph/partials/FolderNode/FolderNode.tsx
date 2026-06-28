import { Handle, Position, type NodeProps } from '@xyflow/react'
import { CIRCULAR_NODE_BACKGROUND, MaterialFileSystemIcon } from '../../../../Shared'
import type { FolderNodeData } from '../../DependencyGraph.types'
import styles from '../../DependencyGraph.module.css'
import { FolderExpandToggle } from '../FolderExpandToggle'
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
        <FolderExpandToggle
          expanded={expanded}
          onClick={(e) => {
            e.stopPropagation()
            onToggle(path)
          }}
        />
        <MaterialFileSystemIcon
          name={label}
          isFolder
          isOpen={expanded}
          className={styles.icon}
        />
        <span className={styles.label}>{label}</span>
        <Handle type="source" position={Position.Right} />
      </div>
    </NodeContextMenu>
  )
}
