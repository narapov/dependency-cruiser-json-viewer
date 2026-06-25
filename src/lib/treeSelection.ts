import type { TreeDataNode } from 'antd'

export interface TreeIndex {
  descendantsByKey: Map<string, string[]>
}

export function buildTreeIndex(treeData: TreeDataNode[]): TreeIndex {
  const descendantsByKey = new Map<string, string[]>()

  function indexNode(node: TreeDataNode): string[] {
    const descendantKeys: string[] = []

    if (node.children) {
      for (const child of node.children) {
        descendantKeys.push(String(child.key), ...indexNode(child))
      }
    }

    descendantsByKey.set(String(node.key), descendantKeys)
    return descendantKeys
  }

  for (const node of treeData) {
    indexNode(node)
  }

  return { descendantsByKey }
}

export function getAncestorKeys(key: string): string[] {
  const parts = key.split('/')
  const ancestors: string[] = []

  for (let i = 1; i < parts.length; i++) {
    ancestors.push(parts.slice(0, i).join('/'))
  }

  return ancestors
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

  const toRemove = new Set([
    toggledKey,
    ...descendants,
    ...getAncestorKeys(toggledKey),
  ])

  return currentSelectedKeys.filter((key) => !toRemove.has(key))
}

export function computeCheckState(
  selectedKeys: string[],
  index: TreeIndex,
): { checked: string[]; halfChecked: string[] } {
  const selectedSet = new Set(selectedKeys)
  const halfChecked: string[] = []

  for (const [key, descendants] of index.descendantsByKey) {
    if (selectedSet.has(key)) continue
    if (descendants.some((descendant) => selectedSet.has(descendant))) {
      halfChecked.push(key)
    }
  }

  return { checked: selectedKeys, halfChecked }
}

export function getDefaultExpandedKeys(treeData: TreeDataNode[]): string[] {
  const hasSrc = treeData.some((node) => String(node.key) === 'src' && !node.isLeaf)
  return hasSrc ? ['src'] : []
}

export function toggleExpandedKey(keys: string[], path: string): string[] {
  return keys.includes(path)
    ? keys.filter((k) => k !== path)
    : [...keys, path]
}

export function getTopLevelFolderKeys(treeData: TreeDataNode[]): string[] {
  return treeData
    .filter((node) => !node.isLeaf)
    .map((node) => String(node.key))
}

export function getDefaultSelectedKeys(treeData: TreeDataNode[]): string[] {
  const index = buildTreeIndex(treeData)
  let selected: string[] = []

  for (const key of getTopLevelFolderKeys(treeData)) {
    selected = applyCascadeSelection(selected, key, true, index)
  }

  return selected
}

export function canShowInGraph(
  key: string,
  selectedKeys: string[],
  index: TreeIndex,
  isLeaf: boolean,
): boolean {
  if (selectedKeys.includes(key)) return true
  if (isLeaf) return false

  const selectedSet = new Set(selectedKeys)
  const descendants = index.descendantsByKey.get(key) ?? []
  return descendants.some((descendant) => selectedSet.has(descendant))
}
