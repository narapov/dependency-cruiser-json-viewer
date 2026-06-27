import { getAncestorKeys } from '../../../../domain'
import { isTreeBranch } from '../treeGuards'
import type { TreeIndex } from '../treeIndex'
import type { TreeNodeData } from '../../types'

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

  const toRemove = new Set([toggledKey, ...descendants, ...getAncestorKeys(toggledKey)])

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

export function getTopLevelFolderKeys(treeData: TreeNodeData[]): string[] {
  return treeData.filter(isTreeBranch).map((node) => node.key)
}
