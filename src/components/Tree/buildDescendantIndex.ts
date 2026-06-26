import type { TreeNodeData } from './types'

export function buildDescendantIndex(
  treeData: TreeNodeData[],
): Map<string, string[]> {
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

  return descendantsByKey
}

export function computeIndeterminateKeys(
  checkedKeys: string[],
  descendantsByKey: Map<string, string[]>,
): Set<string> {
  const checkedSet = new Set(checkedKeys)
  const indeterminate = new Set<string>()

  for (const [key, descendants] of descendantsByKey) {
    if (checkedSet.has(key)) continue
    if (descendants.some((descendant) => checkedSet.has(descendant))) {
      indeterminate.add(key)
    }
  }

  return indeterminate
}

export function getTreeMaxDepth(treeData: TreeNodeData[]): number {
  let maxDepth = 0

  function walk(nodes: TreeNodeData[], depth: number) {
    for (const node of nodes) {
      maxDepth = Math.max(maxDepth, depth)
      if (node.children) {
        walk(node.children, depth + 1)
      }
    }
  }

  walk(treeData, 0)
  return maxDepth
}
