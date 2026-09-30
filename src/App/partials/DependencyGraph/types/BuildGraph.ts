import type { CruiseSnapshot, VisibleTreeEdge, VisibleTreeNode } from '@/domain';

/** Sparse presence record (`true` when the path is present). */
export type PresenceRecord = Record<string, boolean | undefined>;

export interface BuildGraphOptions {
  debug: boolean;
}

export interface BuildGraphInput {
  cruiseSnapshot: CruiseSnapshot;
  selectedFilePaths: PresenceRecord;
  visibleTree: readonly VisibleTreeNode[];
  options: BuildGraphOptions;
}

/** Visible-tree node with ELK layout geometry. */
export interface VisibleTreeLayoutedNode extends VisibleTreeNode {
  children?: VisibleTreeLayoutedNode[];
  position: { x: number; y: number };
  width: number;
  height: number;
}

/**
 * Layouted graph shaped like {@link CruiseSnapshot}: flat `nodes` index plus root `tree`.
 * Entries in `tree` / `children` are the same object references as in `nodes`.
 */
export interface BuildGraphResult {
  /** Flat path → layouted node index (files + folders). */
  nodes: Map<string, VisibleTreeLayoutedNode>;
  /** Root path → layouted node hierarchy. */
  tree: Map<string, VisibleTreeLayoutedNode>;
  edges: VisibleTreeEdge[];
}
