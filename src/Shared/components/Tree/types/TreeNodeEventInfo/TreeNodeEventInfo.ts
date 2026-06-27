import type { MouseEvent } from 'react'
import type { TreeNodeData } from '../TreeNodeData'

export interface TreeNodeEventInfo {
  key: string
  node: TreeNodeData
  nativeEvent: MouseEvent
}
