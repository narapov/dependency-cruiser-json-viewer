import type { TreeNodeData } from '../../types';

export function isTreeBranch(node: TreeNodeData): boolean {
  return node.children !== undefined;
}

export function isTreeLeaf(node: TreeNodeData): boolean {
  return node.children === undefined;
}
