import type { Edge, Node } from '@xyflow/react';

import type { CruiseTreeSnapshot } from '@/domain';

export interface BuildGraphInput {
  cruiseTree: CruiseTreeSnapshot;
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
