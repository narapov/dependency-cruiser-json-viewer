import type { CruiseSnapshot } from '../../../types';
import { getEdgesAmongNodePaths, type VisibleTreeEdge } from '../getEdgesAmongNodePaths';
import type { VisibleTreeNode } from '../getVisibleTree';
import { getVisibleTreeLeafNodePaths } from '../getVisibleTreeLeafNodePaths';

export type { VisibleTreeEdge };

/** Build leaf-to-leaf edges for a visible tree among selected modules. */
export function getEdgesForVisibleTree(
  cruiseSnapshot: CruiseSnapshot,
  visibleTree: readonly VisibleTreeNode[],
  selectedFilePaths: Record<string, boolean | undefined>,
): VisibleTreeEdge[] {
  return getEdgesAmongNodePaths(cruiseSnapshot, getVisibleTreeLeafNodePaths(visibleTree), selectedFilePaths);
}
