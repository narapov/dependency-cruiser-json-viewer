import { isTreeBranch, type TreeNodeData } from '../../../../Shared'

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

export function applyCascadeSelection(
  currentSelectedKeys: string[],
  toggledKey: string,
  isSelecting: boolean,
  index: TreeIndex,
): string[] {
  const descendants = index.descendantsByKey.get(toggledKey) ?? []

  if (isSelecting) {
    return [...new Set([...currentSelectedKeys, toggledKey, ...descendants])]
  }

  const toRemove = new Set([toggledKey, ...descendants])
  return currentSelectedKeys.filter((key) => !toRemove.has(key))
}

export function canShowInGraph(
  key: string,
  selectedKeys: string[],
  index: TreeIndex,
  node: TreeNodeData,
): boolean {
  if (selectedKeys.includes(key)) return true
  if (!isTreeBranch(node)) return false

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
