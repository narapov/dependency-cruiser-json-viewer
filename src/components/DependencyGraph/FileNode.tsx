import { FileOutlined } from '@ant-design/icons'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { FileNodeData } from '../../lib/dependencyGraph/types'
import styles from './DependencyGraph.module.css'

export function FileNode({ data }: NodeProps) {
  const { label, highlighted } = data as FileNodeData

  return (
    <div className={`${styles.node} ${highlighted ? styles.highlighted : ''}`}>
      <Handle type="target" position={Position.Left} />
      <FileOutlined className={styles.icon} />
      <span className={styles.label}>{label}</span>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
