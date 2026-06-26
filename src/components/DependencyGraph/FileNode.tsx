import { FileOutlined } from '@ant-design/icons'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { CIRCULAR_NODE_BACKGROUND } from '../../lib/dependencyGraph/buildGraph'
import type { FileNodeData } from '../../lib/dependencyGraph/types'
import styles from './DependencyGraph.module.css'
import { NodeContextMenu } from './NodeContextMenu'

export function FileNode({ data }: NodeProps) {
  const { label, path, highlighted, circular, onShowInFileTree } = data as FileNodeData

  return (
    <NodeContextMenu
      path={path}
      isFolder={false}
      onShowInFileTree={onShowInFileTree}
    >
      <div
        className={`${styles.node} ${highlighted ? styles.highlighted : ''} ${circular ? styles.circular : ''}`}
        style={circular ? { backgroundColor: CIRCULAR_NODE_BACKGROUND } : undefined}
      >
        <Handle type="target" position={Position.Left} />
        <FileOutlined className={styles.icon} />
        <span className={styles.label}>{label}</span>
        <Handle type="source" position={Position.Right} />
      </div>
    </NodeContextMenu>
  )
}
