import type { ReactNode, MouseEvent } from 'react'

export interface TreeNodeData {
  key: string
  title: ReactNode
  children?: TreeNodeData[]
}

export function isTreeBranch(node: TreeNodeData): boolean {
  return node.children !== undefined
}

export function isTreeLeaf(node: TreeNodeData): boolean {
  return node.children === undefined
}

export interface TreeNodeEventInfo {
  key: string
  node: TreeNodeData
  nativeEvent: MouseEvent
}

export interface TreeHandle {
  scrollIntoView: (key: string, options?: ScrollIntoViewOptions) => void
  getElementByKey: (key: string) => HTMLElement | null
}

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
