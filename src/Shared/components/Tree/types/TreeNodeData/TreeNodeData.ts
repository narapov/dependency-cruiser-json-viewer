import type { ReactNode } from 'react'

export interface TreeNodeData {
  key: string
  title: ReactNode
  children?: TreeNodeData[]
}
