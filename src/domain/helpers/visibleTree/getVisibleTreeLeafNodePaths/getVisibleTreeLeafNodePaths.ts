import type { VisibleTreeNode } from '../getVisibleTree';

/** Collect leaf paths from a visible tree (nodes without children). */
export function getVisibleTreeLeafNodePaths(visibleTree: readonly VisibleTreeNode[]): string[] {
  return visibleTree.flatMap(node => (node.children ? getVisibleTreeLeafNodePaths(node.children) : [node.path]));
}
