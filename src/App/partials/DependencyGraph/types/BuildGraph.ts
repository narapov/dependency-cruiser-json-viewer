import type { IModule } from 'dependency-cruiser';

import type { Edge, Node } from '@xyflow/react';

export interface BuildGraphInput {
  modules: IModule[];
  selectedPaths: string[];
  expandedFolders: Set<string>;
  folderColors: ReadonlyMap<string, string>;
}

export interface BuildGraphResult {
  nodes: Node[];
  edges: Edge[];
  visibleNodeIds: ReadonlySet<string>;
  parentByNode: ReadonlyMap<string, string | null>;
}
