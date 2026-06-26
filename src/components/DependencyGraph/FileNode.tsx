import { FileOutlined } from '@ant-design/icons'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { FileNodeData } from '../../lib/dependencyGraph/types'
import styles from './DependencyGraph.module.css'
import { NodeContextMenu } from './NodeContextMenu'

export function FileNode({ data }: NodeProps) {
  const { label, path, highlighted, onShowInFileTree } = data as FileNodeData

  return (
    <NodeContextMenu
      path={path}
      isFolder={false}
      onShowInFileTree={onShowInFileTree}
    >
      <div className={`${styles.node} ${highlighted ? styles.highlighted : ''}`}>
        <Handle type="target" position={Position.Left} />
        <FileOutlined className={styles.icon} />
        <span className={styles.label}>{label}</span>
        <Handle type="source" position={Position.Right} />
      </div>
    </NodeContextMenu>
  )
}
