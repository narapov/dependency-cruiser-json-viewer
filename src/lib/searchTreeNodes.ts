import { isTreeBranch, type TreeNodeData } from '../components/Tree'

export interface SearchableNode {
  key: string
  name: string
  isFolder: boolean
  node: TreeNodeData
}

const MAX_RESULTS = 100

export function flattenTreeNodes(treeData: TreeNodeData[]): SearchableNode[] {
  const items: SearchableNode[] = []

  function walk(node: TreeNodeData) {
    const isFolder = isTreeBranch(node)
    items.push({
      key: node.key,
      name: String(node.title),
      isFolder,
      node,
    })
    node.children?.forEach(walk)
  }

  treeData.forEach(walk)
  return items
}

function scoreMatch(item: SearchableNode, query: string): number {
  const name = item.name.toLowerCase()
  const key = item.key.toLowerCase()

  if (name === query) return 0
  if (name.startsWith(query)) return 1
  if (name.includes(query)) return 2
  if (key.includes(query)) return 3
  return -1
}

export function searchTreeNodes(items: SearchableNode[], query: string): SearchableNode[] {
  const trimmed = query.trim().toLowerCase()

  if (!trimmed) {
    return items.slice(0, MAX_RESULTS)
  }

  return items
    .map((item) => ({ item, score: scoreMatch(item, trimmed) }))
    .filter(({ score }) => score >= 0)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score
      return a.item.key.localeCompare(b.item.key)
    })
    .slice(0, MAX_RESULTS)
    .map(({ item }) => item)
}

export function findTreeNode(treeData: TreeNodeData[], key: string): TreeNodeData | undefined {
  for (const node of treeData) {
    if (node.key === key) return node
    if (node.children) {
      const found = findTreeNode(node.children, key)
      if (found) return found
    }
  }
  return undefined
}
