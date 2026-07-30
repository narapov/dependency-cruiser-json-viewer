import type { TreeNodeData } from '../../types';

/** Whether the node is a folder (has children). */
export function isTreeBranch(node: TreeNodeData): boolean {
  return node.children !== undefined;
}

/** Whether the node is a file (no children). */
export function isTreeLeaf(node: TreeNodeData): boolean {
  return node.children === undefined;
}
