import type { Edge, Node } from '@xyflow/react'
import type { IModule } from 'dependency-cruiser'

export interface BuildGraphInput {
  modules: IModule[]
  selectedPaths: string[]
  expandedFolders: Set<string>
  highlightedNodeId: string | null
  folderColors: ReadonlyMap<string, string>
  onToggleFolder: (path: string) => void
  onExpandRecursive: (path: string) => void
  onShowInFileTree: (path: string) => void
  onShowDependencies?: (path: string) => void
}

export interface BuildGraphResult {
  nodes: Node[]
  edges: Edge[]
}
