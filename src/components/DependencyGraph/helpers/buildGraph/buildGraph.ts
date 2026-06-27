import dagre from '@dagrejs/dagre'
import { MarkerType, type Edge, type Node } from '@xyflow/react'
import type { IModule } from 'dependency-cruiser'
import { getBaseName, getParentPath, getRepresentative } from '../pathUtils'
import type {
  BuildGraphInput,
  BuildGraphResult,
  FileNodeData,
  FolderChildren,
  FolderGroupNodeData,
  FolderNodeData,
} from '../../DependencyGraph.types'

export const INCOMING_EDGE_COLOR = '#1677ff'
export const OUTGOING_EDGE_COLOR = '#52c41a'
export const CIRCULAR_EDGE_COLOR = '#ff4d4f'
export const CIRCULAR_NODE_BACKGROUND = '#fff1f0'
export const SELECTED_EDGE_COLOR = '#fa8c16'
export const SELECTED_EDGE_Z_INDEX = 1000

const NODE_WIDTH = 180
const NODE_HEIGHT = 40
const GROUP_PADDING = 16
const GROUP_HEADER = 36

interface NodeSize {
  width: number
  height: number
}

function buildChildrenIndex(sources: string[]): Map<string, FolderChildren> {
  const index = new Map<string, { folders: Set<string>; files: Set<string> }>()

  function ensure(folder: string) {
    if (!index.has(folder)) {
      index.set(folder, { folders: new Set(), files: new Set() })
    }
    return index.get(folder)!
  }

  for (const source of sources) {
    const parts = source.split('/')
    for (let i = 0; i < parts.length - 1; i++) {
      const folder = parts.slice(0, i + 1).join('/')
      if (i + 1 === parts.length - 1) {
        ensure(folder).files.add(source)
      } else {
        const subfolder = parts.slice(0, i + 2).join('/')
        ensure(folder).folders.add(subfolder)
      }
    }
  }

  const result = new Map<string, FolderChildren>()
  for (const [folder, children] of index) {
    result.set(folder, {
      folders: [...children.folders].sort(),
      files: [...children.files].sort(),
    })
  }
  return result
}

function isFilePath(path: string, moduleSources: Set<string>): boolean {
  return moduleSources.has(path)
}

function isExpandedFolder(
  path: string,
  visibleNodes: Map<string, 'folder' | 'file'>,
  expandedFolders: Set<string>,
): boolean {
  return visibleNodes.get(path) === 'folder' && expandedFolders.has(path)
}

function hasSelectedDescendants(
  folderPath: string,
  selectedSet: Set<string>,
  childrenIndex: Map<string, FolderChildren>,
): boolean {
  if (selectedSet.has(folderPath)) return true

  const children = childrenIndex.get(folderPath)
  if (!children) return false

  for (const file of children.files) {
    if (selectedSet.has(file)) return true
  }
  for (const subfolder of children.folders) {
    if (hasSelectedDescendants(subfolder, selectedSet, childrenIndex)) return true
  }
  return false
}

function collectCircularModules(modules: IModule[]): Set<string> {
  const circularModules = new Set<string>()
  for (const module of modules) {
    if (!Array.isArray(module.dependencies)) continue
    if (module.dependencies.some((dep) => dep.circular === true)) {
      circularModules.add(module.source)
    }
  }
  return circularModules
}

function folderHasCircularDescendant(
  folderPath: string,
  selectedSet: Set<string>,
  childrenIndex: Map<string, FolderChildren>,
  circularModules: Set<string>,
): boolean {
  const children = childrenIndex.get(folderPath)
  if (!children) return false

  for (const file of children.files) {
    if (selectedSet.has(file) && circularModules.has(file)) return true
  }
  for (const subfolder of children.folders) {
    if (hasSelectedDescendants(subfolder, selectedSet, childrenIndex)) {
      if (folderHasCircularDescendant(subfolder, selectedSet, childrenIndex, circularModules)) {
        return true
      }
    }
  }
  return false
}

function getEffectiveRoot(
  path: string,
  selectedSet: Set<string>,
  childrenIndex: Map<string, FolderChildren>,
): string {
  let topmost = path
  let current = path

  while (true) {
    const parent = getParentPath(current)
    if (!parent) break

    if (selectedSet.has(parent) || hasSelectedDescendants(parent, selectedSet, childrenIndex)) {
      topmost = parent
      current = parent
    } else {
      break
    }
  }

  return topmost
}

function getRootSelectedPaths(
  selectedPaths: string[],
  selectedSet: Set<string>,
  childrenIndex: Map<string, FolderChildren>,
): string[] {
  const roots = new Set<string>()
  for (const path of selectedPaths) {
    roots.add(getEffectiveRoot(path, selectedSet, childrenIndex))
  }
  return [...roots].sort()
}

function collectVisibleNodes(
  paths: string[],
  selectedSet: Set<string>,
  expandedFolders: Set<string>,
  moduleSources: Set<string>,
  childrenIndex: Map<string, FolderChildren>,
  visibleNodes: Map<string, 'folder' | 'file'>,
): void {
  for (const path of paths) {
    if (!selectedSet.has(path) && !hasSelectedDescendants(path, selectedSet, childrenIndex)) {
      continue
    }

    if (isFilePath(path, moduleSources)) {
      if (selectedSet.has(path)) {
        visibleNodes.set(path, 'file')
      }
      continue
    }

    visibleNodes.set(path, 'folder')

    if (!expandedFolders.has(path)) continue

    const children = childrenIndex.get(path)
    if (!children) continue

    for (const subfolder of children.folders) {
      if (hasSelectedDescendants(subfolder, selectedSet, childrenIndex)) {
        collectVisibleNodes(
          [subfolder],
          selectedSet,
          expandedFolders,
          moduleSources,
          childrenIndex,
          visibleNodes,
        )
      }
    }

    for (const file of children.files) {
      if (selectedSet.has(file)) {
        visibleNodes.set(file, 'file')
      }
    }
  }
}

function buildParentByNode(
  visibleNodes: Map<string, 'folder' | 'file'>,
  expandedFolders: Set<string>,
): Map<string, string | null> {
  const parentByNode = new Map<string, string | null>()

  for (const path of visibleNodes.keys()) {
    const directParent = getParentPath(path)
    if (
      directParent &&
      visibleNodes.has(directParent) &&
      expandedFolders.has(directParent)
    ) {
      parentByNode.set(path, directParent)
    } else {
      parentByNode.set(path, null)
    }
  }

  return parentByNode
}

function getDirectChildren(
  folderId: string | null,
  visibleNodeIds: Set<string>,
  parentByNode: Map<string, string | null>,
): string[] {
  const children: string[] = []
  for (const id of visibleNodeIds) {
    const parent = parentByNode.get(id) ?? null
    if (parent === folderId) {
      children.push(id)
    }
  }
  return children.sort()
}

function layoutGroup(
  folderId: string | null,
  nodeMap: Map<string, Node>,
  groupSizes: Map<string, NodeSize>,
  visibleNodes: Map<string, 'folder' | 'file'>,
  expandedFolders: Set<string>,
  visibleNodeIds: Set<string>,
  parentByNode: Map<string, string | null>,
  edges: Edge[],
): NodeSize {
  const childIds = getDirectChildren(folderId, visibleNodeIds, parentByNode)

  if (childIds.length === 0) {
    const emptySize = {
      width: NODE_WIDTH + GROUP_PADDING * 2,
      height: GROUP_HEADER + NODE_HEIGHT + GROUP_PADDING * 2,
    }
    if (folderId !== null) {
      groupSizes.set(folderId, emptySize)
    }
    return emptySize
  }

  const childSizes = new Map<string, NodeSize>()

  for (const childId of childIds) {
    if (isExpandedFolder(childId, visibleNodes, expandedFolders)) {
      const size = layoutGroup(
        childId,
        nodeMap,
        groupSizes,
        visibleNodes,
        expandedFolders,
        visibleNodeIds,
        parentByNode,
        edges,
      )
      childSizes.set(childId, size)
    } else {
      childSizes.set(childId, { width: NODE_WIDTH, height: NODE_HEIGHT })
    }
  }

  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 80 })

  for (const childId of childIds) {
    const size = childSizes.get(childId)!
    graph.setNode(childId, { width: size.width, height: size.height })
  }

  for (const edge of edges) {
    if (childIds.includes(edge.source) && childIds.includes(edge.target)) {
      graph.setEdge(edge.source, edge.target)
    }
  }

  dagre.layout(graph)

  let maxX = 0
  let maxY = 0

  for (const childId of childIds) {
    const dagreNode = graph.node(childId)
    const size = childSizes.get(childId)!
    const x = dagreNode.x - size.width / 2 + GROUP_PADDING
    const y = dagreNode.y - size.height / 2 + GROUP_HEADER + GROUP_PADDING

    const node = nodeMap.get(childId)!
    node.position = { x, y }
    if (folderId !== null) {
      node.parentId = folderId
      node.extent = 'parent'
    }

    maxX = Math.max(maxX, x + size.width)
    maxY = Math.max(maxY, y + size.height)
  }

  const groupSize = {
    width: Math.max(maxX + GROUP_PADDING, NODE_WIDTH + GROUP_PADDING * 2),
    height: Math.max(maxY + GROUP_PADDING, GROUP_HEADER + NODE_HEIGHT + GROUP_PADDING),
  }

  if (folderId !== null) {
    groupSizes.set(folderId, groupSize)
    const groupNode = nodeMap.get(folderId)
    if (groupNode) {
      groupNode.style = {
        ...groupNode.style,
        width: groupSize.width,
        height: groupSize.height,
      }
      groupNode.zIndex = -1
    }
  }

  return groupSize
}

export function buildGraph({
  modules,
  selectedPaths,
  expandedFolders,
  highlightedNodeId,
  folderColors,
  onToggleFolder,
  onExpandRecursive,
  onShowInFileTree,
  onShowDependencies,
}: BuildGraphInput): BuildGraphResult {
  const selectedSet = new Set(selectedPaths)
  const moduleSources = new Set(modules.map((m) => m.source))
  const childrenIndex = buildChildrenIndex(modules.map((m) => m.source))
  const circularModules = collectCircularModules(modules)

  const visibleNodes = new Map<string, 'folder' | 'file'>()
  const roots = getRootSelectedPaths(selectedPaths, selectedSet, childrenIndex)
  collectVisibleNodes(
    roots,
    selectedSet,
    expandedFolders,
    moduleSources,
    childrenIndex,
    visibleNodes,
  )

  const visibleNodeIds = new Set(visibleNodes.keys())
  const parentByNode = buildParentByNode(visibleNodes, expandedFolders)

  const edgeKeys = new Set<string>()
  const edges: Edge[] = []

  for (const module of modules) {
    if (!selectedSet.has(module.source)) continue

    for (const dep of module.dependencies) {
      const resolved = dep.resolved
      if (!resolved || !selectedSet.has(resolved)) continue

      const sourceRep = getRepresentative(module.source, selectedSet, expandedFolders)
      const targetRep = getRepresentative(resolved, selectedSet, expandedFolders)

      if (sourceRep === targetRep) continue
      if (!visibleNodeIds.has(sourceRep) || !visibleNodeIds.has(targetRep)) continue

      const edgeKey = `${sourceRep}->${targetRep}`
      if (edgeKeys.has(edgeKey)) continue
      edgeKeys.add(edgeKey)

      const isIncoming =
        highlightedNodeId != null && targetRep === highlightedNodeId
      const isOutgoing =
        highlightedNodeId != null && sourceRep === highlightedNodeId

      let stroke = '#b1b1b7'
      let strokeWidth = 1
      if (dep.circular === true) {
        stroke = CIRCULAR_EDGE_COLOR
        strokeWidth = 2
      } else if (isIncoming) {
        stroke = INCOMING_EDGE_COLOR
        strokeWidth = 2
      } else if (isOutgoing) {
        stroke = OUTGOING_EDGE_COLOR
        strokeWidth = 2
      }

      edges.push({
        id: edgeKey,
        type: 'dependency',
        source: sourceRep,
        target: targetRep,
        interactionWidth: 3,
        data: { title: `${sourceRep} -> ${targetRep}` },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: stroke,
        },
        style: { stroke, strokeWidth },
      })
    }
  }

  const nodeMap = new Map<string, Node>()
  const groupSizes = new Map<string, NodeSize>()

  for (const [path, type] of visibleNodes) {
    const highlighted = path === highlightedNodeId
    const parentId = parentByNode.get(path) ?? undefined

    if (type === 'folder') {
      const expanded = expandedFolders.has(path)

      if (expanded) {
        const data: FolderGroupNodeData = {
          label: getBaseName(path),
          path,
          expanded: true,
          highlighted,
          backgroundColor: folderColors.get(path) ?? 'rgba(0, 0, 0, 0.02)',
          onToggle: onToggleFolder,
          onExpandRecursive,
          onShowInFileTree,
          onShowDependencies,
        }
        nodeMap.set(path, {
          id: path,
          type: 'folderGroup',
          position: { x: 0, y: 0 },
          data,
          parentId,
          draggable: false,
          zIndex: -1,
        })
      } else {
        const circular = folderHasCircularDescendant(
          path,
          selectedSet,
          childrenIndex,
          circularModules,
        )
        const data: FolderNodeData = {
          label: getBaseName(path),
          path,
          expanded: false,
          highlighted,
          circular,
          backgroundColor: folderColors.get(path) ?? 'rgba(0, 0, 0, 0.02)',
          onToggle: onToggleFolder,
          onExpandRecursive,
          onShowInFileTree,
          onShowDependencies,
        }
        nodeMap.set(path, {
          id: path,
          type: 'folder',
          position: { x: 0, y: 0 },
          data,
          parentId,
          extent: parentId ? 'parent' : undefined,
        })
      }
    } else {
      const data: FileNodeData = {
        label: getBaseName(path),
        path,
        highlighted,
        circular: circularModules.has(path),
        onShowInFileTree,
        onShowDependencies,
      }
      nodeMap.set(path, {
        id: path,
        type: 'file',
        position: { x: 0, y: 0 },
        data,
        parentId,
        extent: parentId ? 'parent' : undefined,
      })
    }
  }

  layoutGroup(
    null,
    nodeMap,
    groupSizes,
    visibleNodes,
    expandedFolders,
    visibleNodeIds,
    parentByNode,
    edges,
  )

  return {
    nodes: [...nodeMap.values()],
    edges,
  }
}
