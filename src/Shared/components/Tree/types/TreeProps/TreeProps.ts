import type { ReactNode } from 'react'
import type { TreeNodeData } from '../TreeNodeData'
import type { TreeNodeEventInfo } from '../TreeNodeEventInfo'

export interface TreeProps {
  treeData: TreeNodeData[]
  expandedKeys: string[]
  checkedKeys?: string[]
  activeKey?: string | null
  checkable?: boolean
  className?: string
  titleRender?: (node: TreeNodeData) => ReactNode
  onClick?: (info: TreeNodeEventInfo) => void
  onDoubleClick?: (info: TreeNodeEventInfo) => void
  onCheck?: (key: string, checked: boolean, info: TreeNodeEventInfo) => void
  onContextMenu?: (info: TreeNodeEventInfo) => void
  onExpand?: (key: string, expanded: boolean, info: TreeNodeEventInfo) => void
}
