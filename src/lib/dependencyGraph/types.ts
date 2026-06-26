import type { Edge, Node } from '@xyflow/react'
import type { IModule } from 'dependency-cruiser'

export interface FolderChildren {
  folders: string[]
  files: string[]
}

export interface BuildGraphInput {
  modules: IModule[]
  selectedPaths: string[]
  expandedFolders: Set<string>
  highlightedNodeId: string | null
  folderColors: ReadonlyMap<string, string>
  onToggleFolder: (path: string) => void
  onShowInFileTree: (path: string) => void
}

export interface BuildGraphResult {
  nodes: Node[]
  edges: Edge[]
}

export interface FolderNodeData {
  label: string
  path: string
  expanded: boolean
  highlighted: boolean
  circular?: boolean
  backgroundColor: string
  onToggle: (path: string) => void
  onShowInFileTree: (path: string) => void
  [key: string]: unknown
}

export interface FolderGroupNodeData {
  label: string
  path: string
  expanded: boolean
  highlighted: boolean
  backgroundColor: string
  onToggle: (path: string) => void
  onShowInFileTree: (path: string) => void
  [key: string]: unknown
}

export interface FileNodeData {
  label: string
  path: string
  highlighted: boolean
  circular?: boolean
  onShowInFileTree: (path: string) => void
  [key: string]: unknown
}

export interface DependencyEdgeData {
  title: string
  [key: string]: unknown
}
