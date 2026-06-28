import dagre from '@dagrejs/dagre'
import { MarkerType, type Edge, type Node } from '@xyflow/react'
import type { IModule } from 'dependency-cruiser'
import {
  CIRCULAR_EDGE_COLOR,
  DEFAULT_EDGE_COLOR,
  INCOMING_EDGE_COLOR,
  OUTGOING_EDGE_COLOR,
  TYPE_ONLY_CIRCULAR_EDGE_COLOR,
} from '../../../../Shared'
import {
  createDependencyRelationFlags,
  finalizeDependencyRelationFlags,
  getBaseName,
  getParentPath,
  getRepresentative,
  isTypeOnlyDependency,
  mergeDependencyRelationFlags,
} from '../../../../domain'
import type {
  BuildGraphInput,
  BuildGraphResult,
  FileNodeData,
  FolderChildren,
  FolderGroupNodeData,
  FolderNodeData,
} from '../../DependencyGraph.types'

const NODE_WIDTH = 180
const NODE_HEIGHT = 40
const GROUP_PADDING = 16
const GROUP_HEADER = 36
const GRID_MIN_CHILDREN = 6
const GRID_MAX_EDGE_RATIO = 0.4
const GRID_GAP_X = 60
const GRID_GAP_Y = 24
const TYPE_ONLY_EDGE_DASH = '6 4'

interface EdgeBuildInfo {
  sourceRep: string
  targetRep: string
  typeOnly: boolean
  valueCircular: boolean
  typeOnlyCircular: boolean
}

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
    if (module.dependencies.some((dep) => dep.circular === true && !isTypeOnlyDependency(dep))) {
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

function getLayoutSpacing(childCount: number) {
  return {
    nodesep: Math.min(80, 24 + childCount * 2),
    ranksep: Math.min(160, 60 + childCount * 4),
  }
}

function getSiblingEdges(childIds: string[], edges: Edge[]): Edge[] {
  const childSet = new Set(childIds)
  return edges.filter(
    (edge) => childSet.has(edge.source) && childSet.has(edge.target),
  )
}

// Dense groups with few sibling dependencies get a grid instead of dagre.
function shouldUseGridLayout(childIds: string[], edges: Edge[]): boolean {
  if (childIds.length < GRID_MIN_CHILDREN) return false
  const siblingEdges = getSiblingEdges(childIds, edges)
  return siblingEdges.length / childIds.length < GRID_MAX_EDGE_RATIO
}

function orderChildrenForGrid(childIds: string[], edges: Edge[]): string[] {
  const childSet = new Set(childIds)
  const withOutgoing = new Set<string>()
  for (const edge of edges) {
    if (childSet.has(edge.source) && childSet.has(edge.target)) {
      withOutgoing.add(edge.source)
    }
  }
  return [
    ...childIds.filter((id) => withOutgoing.has(id)),
    ...childIds.filter((id) => !withOutgoing.has(id)),
  ]
}

function layoutChildrenWithDagre(
  childIds: string[],
  childSizes: Map<string, NodeSize>,
  edges: Edge[],
): Map<string, { x: number; y: number }> {
  const spacing = getLayoutSpacing(childIds.length)
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: 'LR', ...spacing })

  for (const childId of childIds) {
    const size = childSizes.get(childId)!
    graph.setNode(childId, { width: size.width, height: size.height })
  }

  const childSet = new Set(childIds)
  for (const edge of edges) {
    if (childSet.has(edge.source) && childSet.has(edge.target)) {
      graph.setEdge(edge.source, edge.target)
    }
  }

  dagre.layout(graph)

  const positions = new Map<string, { x: number; y: number }>()
  for (const childId of childIds) {
    const dagreNode = graph.node(childId)
    const size = childSizes.get(childId)!
    positions.set(childId, {
      x: dagreNode.x - size.width / 2 + GROUP_PADDING,
      y: dagreNode.y - size.height / 2 + GROUP_HEADER + GROUP_PADDING,
    })
  }
  return positions
}

// Square-ish grid for groups where dagre would stack unrelated nodes vertically.
function layoutChildrenAsGrid(
  childIds: string[],
  childSizes: Map<string, NodeSize>,
  edges: Edge[],
): Map<string, { x: number; y: number }> {
  const columns = Math.ceil(Math.sqrt(childIds.length))
  const orderedIds = orderChildrenForGrid(childIds, edges)
  const positions = new Map<string, { x: number; y: number }>()

  let currentX = GROUP_PADDING
  let currentY = GROUP_HEADER + GROUP_PADDING
  let rowHeight = 0
  let col = 0

  for (const childId of orderedIds) {
    const size = childSizes.get(childId)!

    if (col >= columns) {
      currentX = GROUP_PADDING
      currentY += rowHeight + GRID_GAP_Y
      rowHeight = 0
      col = 0
    }

    positions.set(childId, { x: currentX, y: currentY })
    rowHeight = Math.max(rowHeight, size.height)
    currentX += size.width + GRID_GAP_X
    col++
  }

  return positions
}

function applyChildPositions(
  childIds: string[],
  childSizes: Map<string, NodeSize>,
  positions: Map<string, { x: number; y: number }>,
  folderId: string | null,
  nodeMap: Map<string, Node>,
  groupSizes: Map<string, NodeSize>,
): NodeSize {
  let maxX = 0
  let maxY = 0

  for (const childId of childIds) {
    const size = childSizes.get(childId)!
    const position = positions.get(childId)!
    const node = nodeMap.get(childId)!
    node.position = position
    if (folderId !== null) {
      node.parentId = folderId
      node.extent = 'parent'
    }

    maxX = Math.max(maxX, position.x + size.width)
    maxY = Math.max(maxY, position.y + size.height)
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

/*
 * Layout algorithm (recursive, per folder level):
 *
 * 1. Collect direct children of the current folder (or root when folderId is null).
 * 2. Recurse into expanded subfolders first to compute their sizes.
 * 3. Place direct children using one of two strategies:
 *    - dagre (LR): when the group is small or sibling dependencies are dense enough
 *      to form a meaningful left-to-right flow. Spacing scales with child count.
 *    - grid: when there are many children (>= GRID_MIN_CHILDREN) but few sibling
 *      edges (< GRID_MAX_EDGE_RATIO per node). Dagre with rankdir LR would stack
 *      unrelated nodes in a single vertical column; a sqrt-based grid spreads them
 *      into multiple columns instead.
 *
 * Only edges between direct siblings at the current level influence layout.
 * Cross-group dependencies (e.g. file in src/foo -> file in src/bar) do not
 * affect positions — React Flow draws those edges after layout.
 */
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

  const positions = shouldUseGridLayout(childIds, edges)
    ? layoutChildrenAsGrid(childIds, childSizes, edges)
    : layoutChildrenWithDagre(childIds, childSizes, edges)

  return applyChildPositions(
    childIds,
    childSizes,
    positions,
    folderId,
    nodeMap,
    groupSizes,
  )
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

  const edgeBuildMap = new Map<string, EdgeBuildInfo>()

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
      const isTypeOnly = isTypeOnlyDependency(dep)
      const isCircular = dep.circular === true
      const existing = edgeBuildMap.get(edgeKey)

      if (!existing) {
        edgeBuildMap.set(edgeKey, {
          sourceRep,
          targetRep,
          ...createDependencyRelationFlags(isTypeOnly, isCircular),
        })
      } else {
        mergeDependencyRelationFlags(existing, isTypeOnly, isCircular)
      }
    }
  }

  const edges: Edge[] = []

  for (const [edgeKey, info] of edgeBuildMap) {
    finalizeDependencyRelationFlags(info)

    const { sourceRep, targetRep, typeOnly, valueCircular, typeOnlyCircular } = info

    const isIncoming =
      highlightedNodeId != null && targetRep === highlightedNodeId
    const isOutgoing =
      highlightedNodeId != null && sourceRep === highlightedNodeId

    let stroke = DEFAULT_EDGE_COLOR
    let strokeWidth = 1
    if (valueCircular) {
      stroke = CIRCULAR_EDGE_COLOR
      strokeWidth = 2
    } else if (typeOnlyCircular) {
      stroke = TYPE_ONLY_CIRCULAR_EDGE_COLOR
      strokeWidth = 2
    } else if (isIncoming) {
      stroke = INCOMING_EDGE_COLOR
      strokeWidth = 2
    } else if (isOutgoing) {
      stroke = OUTGOING_EDGE_COLOR
      strokeWidth = 2
    }

    const style: Edge['style'] = { stroke, strokeWidth }
    if (typeOnly) {
      style.strokeDasharray = TYPE_ONLY_EDGE_DASH
    }

    const titleSuffix = typeOnly ? ' (type-only)' : ''

    edges.push({
      id: edgeKey,
      type: 'dependency',
      source: sourceRep,
      target: targetRep,
      interactionWidth: 3,
      data: {
        title: `${sourceRep} -> ${targetRep}${titleSuffix}`,
        typeOnly,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: stroke,
      },
      style,
    })
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
