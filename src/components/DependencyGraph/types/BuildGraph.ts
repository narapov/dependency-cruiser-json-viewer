import type { IModule } from 'dependency-cruiser';

import type { Edge, Node } from '@xyflow/react';

export interface BuildGraphInput {
  modules: IModule[];
  selectedPaths: string[];
  expandedFolders: Set<string>;
  folderColors: ReadonlyMap<string, string>;
  onToggleFolder: (path: string) => void;
  onExpandRecursive: (path: string) => void;
  onShowInFileTree: (path: string) => void;
  onShowDependencies?: (path: string) => void;
}

export interface BuildGraphResult {
  nodes: Node[];
  edges: Edge[];
}
