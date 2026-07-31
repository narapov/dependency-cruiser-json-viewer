import type { TreeNodeData } from '../../types';
import { isTreeBranch } from '../treeGuards';

/** Lookup of each tree key to all descendant keys beneath it. */
export interface TreeIndex {
  descendantsByKey: Map<string, string[]>;
}

/** Indexes every node key to the full list of keys under it. */
export function buildTreeIndex(treeData: TreeNodeData[]): TreeIndex {
  const descendantsByKey = new Map<string, string[]>();

  function indexNode(node: TreeNodeData): string[] {
    const descendantKeys: string[] = [];

    if (node.children) {
      for (const child of node.children) {
        descendantKeys.push(child.key, ...indexNode(child));
      }
    }

    descendantsByKey.set(node.key, descendantKeys);
    return descendantKeys;
  }

  for (const node of treeData) {
    indexNode(node);
  }

  return { descendantsByKey };
}

/** Collects every node key in the tree in depth-first order. */
export function getAllKeys(treeData: TreeNodeData[]): string[] {
  const keys: string[] = [];

  function walk(node: TreeNodeData) {
    keys.push(node.key);
    node.children?.forEach(walk);
  }

  treeData.forEach(walk);
  return keys;
}

/** Collects keys of folder (branch) nodes only. */
export function getAllFolderKeys(treeData: TreeNodeData[]): string[] {
  const keys: string[] = [];

  function walk(node: TreeNodeData) {
    if (isTreeBranch(node)) {
      keys.push(node.key);
    }
    node.children?.forEach(walk);
  }

  treeData.forEach(walk);
  return keys;
}
