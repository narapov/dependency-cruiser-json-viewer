import type { CruiseSnapshot, VisibleTreeEdge, VisibleTreeNode } from '@/domain';

import type { SerializedLayoutCache } from '../../../types';
import type { EdgePorts } from './DependencyEdgeData';

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
  /** Optional group layout cache snapshot applied during ELK layout. */
  layoutCache?: SerializedLayoutCache;
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
  /** Group layouts collected from the visible laid-out tree (for cache merge). */
  visibleGroupLayouts: SerializedLayoutCache;
  /** Frozen per-edge EAST/WEST ports assigned after layout (keyed by edge key). */
  edgePortsById: Map<string, EdgePorts>;
}
