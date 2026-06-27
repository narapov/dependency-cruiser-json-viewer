import type { TreeNodeData } from '../../types'
import { isTreeBranch } from '../treeGuards'

export interface TreeIndex {
  descendantsByKey: Map<string, string[]>
}

export function buildTreeIndex(treeData: TreeNodeData[]): TreeIndex {
  const descendantsByKey = new Map<string, string[]>()

  function indexNode(node: TreeNodeData): string[] {
    const descendantKeys: string[] = []

    if (node.children) {
      for (const child of node.children) {
        descendantKeys.push(child.key, ...indexNode(child))
      }
    }

    descendantsByKey.set(node.key, descendantKeys)
    return descendantKeys
  }

  for (const node of treeData) {
    indexNode(node)
  }

  return { descendantsByKey }
}

export function canShowInGraph(
  key: string,
  selectedKeys: string[],
  index: TreeIndex,
): boolean {
  if (selectedKeys.includes(key)) return true
  if ((index.descendantsByKey.get(key)?.length ?? 0) === 0) return false

  const selectedSet = new Set(selectedKeys)
  const descendants = index.descendantsByKey.get(key) ?? []
  return descendants.some((descendant) => selectedSet.has(descendant))
}

export function getAllKeys(treeData: TreeNodeData[]): string[] {
  const keys: string[] = []

  function walk(node: TreeNodeData) {
    keys.push(node.key)
    node.children?.forEach(walk)
  }

  treeData.forEach(walk)
  return keys
}

export function getAllFolderKeys(treeData: TreeNodeData[]): string[] {
  const keys: string[] = []

  function walk(node: TreeNodeData) {
    if (isTreeBranch(node)) {
      keys.push(node.key)
    }
    node.children?.forEach(walk)
  }

  treeData.forEach(walk)
  return keys
}
