import type { TreeNodeData } from '../../types';
import { isTreeBranch } from '../treeGuards';

/** Lookup of each tree key to all descendant keys beneath it. */
export interface TreeIndex {
  descendantsByKey: Map<string, string[]>;
}

function collectDescendants(node: TreeNodeData): string[] {
  return (node.children ?? []).flatMap(child => [child.key, ...collectDescendants(child)]);
}

/** Indexes every node key to the full list of keys under it. */
export function buildTreeIndex(treeData: TreeNodeData[]): TreeIndex {
  function indexNode(node: TreeNodeData, descendantsByKey: Map<string, string[]>): Map<string, string[]> {
    const descendantKeys = collectDescendants(node);
    descendantsByKey.set(node.key, descendantKeys);
    return (node.children ?? []).reduce((acc, child) => indexNode(child, acc), descendantsByKey);
  }

  return {
    descendantsByKey: treeData.reduce((acc, node) => indexNode(node, acc), new Map<string, string[]>()),
  };
}

/** Collects every node key in the tree in depth-first order. */
export function getAllKeys(treeData: TreeNodeData[]): string[] {
  return treeData.flatMap(node => [node.key, ...getAllKeys(node.children ?? [])]);
}

/** Collects keys of folder (branch) nodes only. */
export function getAllFolderKeys(treeData: TreeNodeData[]): string[] {
  return treeData.flatMap(node => [
    ...(isTreeBranch(node) ? [node.key] : []),
    ...getAllFolderKeys(node.children ?? []),
  ]);
}
