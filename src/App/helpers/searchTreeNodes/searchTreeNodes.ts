import fuzzysort from 'fuzzysort'
import { isTreeBranch, type TreeNodeData } from '../../../Shared'

export interface SearchableNode {
  key: string
  name: string
  isFolder: boolean
  node: TreeNodeData
}

export const PathSearchTier = {
  Src: 0,
  Lib: 1,
  Other: 2,
  NodeModules: 3,
} as const

export type PathSearchTier = (typeof PathSearchTier)[keyof typeof PathSearchTier]

const TIER_SCORE_MULTIPLIER: Record<PathSearchTier, number> = {
  [PathSearchTier.Src]: 100,
  [PathSearchTier.Lib]: 10,
  [PathSearchTier.Other]: 1,
  [PathSearchTier.NodeModules]: 0.01,
}

const MAX_RESULTS = 250

function pathContainsSegment(key: string, segment: string): boolean {
  return key.split('/').includes(segment)
}

export function getPathSearchTier(key: string): PathSearchTier {
  if (pathContainsSegment(key, 'node_modules')) {
    return PathSearchTier.NodeModules
  }
  if (pathContainsSegment(key, 'src')) {
    return PathSearchTier.Src
  }
  if (pathContainsSegment(key, 'lib')) {
    return PathSearchTier.Lib
  }
  return PathSearchTier.Other
}

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

export function searchTreeNodes(items: SearchableNode[], query: string): SearchableNode[] {
  const trimmed = query.trim()

  if (!trimmed) {
    return []
  }

  // Search uses keys: ['name', 'key'] for ranking only (best score wins).
  // name — short basename, better fuzzy score when typing a filename.
  // key — full path, matches scattered queries across segments (e.g. srconteSearque).
  return fuzzysort
    .go(trimmed, items, {
      keys: ['name', 'key'],
      limit: MAX_RESULTS,
      scoreFn: (result) => {
        const multiplier = TIER_SCORE_MULTIPLIER[getPathSearchTier(result.obj.key)]
        return result.score * multiplier
      },
    })
    .map((result) => result.obj)
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
