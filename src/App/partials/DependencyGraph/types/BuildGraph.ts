import type { Edge, Node } from '@xyflow/react';

import type { CruiseSnapshot, VisibleTreeNode } from '@/domain';

/** Sparse presence record (`true` when the path is present). */
export type PresenceRecord = Record<string, boolean | undefined>;

export interface BuildGraphOptions {
  debug: boolean;
}

export interface BuildGraphInput {
  cruiseSnapshot: CruiseSnapshot;
  selectedFilePaths: PresenceRecord;
  visibleTree: readonly VisibleTreeNode[];
  folderColors: ReadonlyMap<string, string>;
  options: BuildGraphOptions;
}

export interface BuildGraphResult {
  nodes: Node[];
  edges: Edge[];
  visibleNodeIds: ReadonlySet<string>;
  parentByNode: ReadonlyMap<string, string | null>;
}
