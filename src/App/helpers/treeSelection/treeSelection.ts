import { isTreeBranch, type TreeNodeData } from '../../../Shared'

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

export function getDefaultExpandedKeys(treeData: TreeNodeData[]): string[] {
  const hasSrc = treeData.some((node) => node.key === 'src' && isTreeBranch(node))
  return hasSrc ? ['src'] : []
}

export function toggleExpandedKey(keys: string[], path: string): string[] {
  return keys.includes(path)
    ? keys.filter((k) => k !== path)
    : [...keys, path]
}

export function resolveActivePathAfterCollapse(
  activePath: string | null,
  collapsedFolders: string[],
): string | null {
  if (!activePath || collapsedFolders.length === 0) return activePath

  let deepestMatch: string | null = null
  for (const folder of collapsedFolders) {
    if (activePath.startsWith(`${folder}/`)) {
      if (!deepestMatch || folder.length > deepestMatch.length) {
        deepestMatch = folder
      }
    }
  }
  return deepestMatch ?? activePath
}

export function getTopLevelFolderKeys(treeData: TreeNodeData[]): string[] {
  return treeData.filter(isTreeBranch).map((node) => node.key)
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

export function getSubtreeFolderKeys(
  folderKey: string,
  treeData: TreeNodeData[],
): string[] {
  const keys: string[] = []

  function collectFolders(node: TreeNodeData) {
    if (isTreeBranch(node)) {
      keys.push(node.key)
      node.children?.forEach(collectFolders)
    }
  }

  function findAndCollect(nodes: TreeNodeData[]): boolean {
    for (const node of nodes) {
      if (node.key === folderKey) {
        collectFolders(node)
        return true
      }
      if (node.children && findAndCollect(node.children)) {
        return true
      }
    }
    return false
  }

  findAndCollect(treeData)
  return keys
}

export function getDefaultSelectedKeys(treeData: TreeNodeData[]): string[] {
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
  node: TreeNodeData,
): boolean {
  if (selectedKeys.includes(key)) return true
  if (!isTreeBranch(node)) return false

  const selectedSet = new Set(selectedKeys)
  const descendants = index.descendantsByKey.get(key) ?? []
  return descendants.some((descendant) => selectedSet.has(descendant))
}
