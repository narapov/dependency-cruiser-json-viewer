import type { Edge, Node } from '@xyflow/react';

import type { CruiseSnapshot } from '@/domain';

/** Sparse presence record (`true` when the path is present). */
export type PresenceRecord = Record<string, boolean | undefined>;

export interface BuildGraphInput {
  cruiseSnapshot: CruiseSnapshot;
  selectedFilePaths: PresenceRecord;
  expandedFolderPaths: PresenceRecord;
  folderColors: ReadonlyMap<string, string>;
}

export interface BuildGraphResult {
  nodes: Node[];
  edges: Edge[];
  visibleNodeIds: ReadonlySet<string>;
  parentByNode: ReadonlyMap<string, string | null>;
}
