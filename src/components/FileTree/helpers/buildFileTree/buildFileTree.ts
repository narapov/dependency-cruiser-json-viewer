import type { TreeNodeData } from '../../types'

interface TreeNode {
  name: string
  path: string
  children: Map<string, TreeNode>
  isFile: boolean
}

export function buildFileTree(sources: string[]): TreeNodeData[] {
  const root = new Map<string, TreeNode>()

  for (const source of sources) {
    const segments = source.split('/')
    let current = root
    let pathSoFar = ''

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      pathSoFar = i === 0 ? segment : `${pathSoFar}/${segment}`
      const isFile = i === segments.length - 1

      if (!current.has(segment)) {
        current.set(segment, {
          name: segment,
          path: pathSoFar,
          children: new Map(),
          isFile,
        })
      }

      current = current.get(segment)!.children
    }
  }

  return mapToTreeData(root)
}

function mapToTreeData(nodes: Map<string, TreeNode>): TreeNodeData[] {
  return [...nodes.values()]
    .sort((a, b) => {
      const aIsDir = !a.isFile
      const bIsDir = !b.isFile
      if (aIsDir !== bIsDir) return aIsDir ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    .map((node) => {
      if (node.isFile) {
        return {
          key: node.path,
          title: node.name,
        }
      }

      return {
        key: node.path,
        title: node.name,
        children: mapToTreeData(node.children),
      }
    })
}
