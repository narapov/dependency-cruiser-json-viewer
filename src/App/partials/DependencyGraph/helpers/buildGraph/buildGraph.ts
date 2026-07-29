import type { IModule } from 'dependency-cruiser';
import ELK from 'elkjs/lib/elk.bundled.js';

import { MarkerType, type Edge, type Node } from '@xyflow/react';

import {
  createDependencyRelationFlags,
  finalizeDependencyRelationFlags,
  getBaseName,
  getParentPath,
  getVisibleRepresentative,
  isTypeOnlyDependency,
  mergeDependencyRelationFlags,
} from '@/domain';
import { CIRCULAR_EDGE_COLOR, DEFAULT_EDGE_COLOR, TYPE_ONLY_CIRCULAR_EDGE_COLOR } from '@/Shared';

import type {
  BuildGraphInput,
  BuildGraphResult,
  FileNodeData,
  FolderChildren,
  FolderGroupNodeData,
  FolderNodeData,
} from '../../types';
import { buildVirtualLayoutEdges, type LayoutEdge } from '../buildVirtualLayoutEdges';
import { getLeafNodeSize, LEAF_NODE_HEIGHT, LEAF_NODE_MIN_WIDTH } from '../getLeafNodeSize';

export const GROUP_PADDING = 16;
export const GROUP_HEADER = 36;
export const GRID_GAP_X = 60;
export const GRID_GAP_Y = 24;

const NODE_HEIGHT = LEAF_NODE_HEIGHT;
const TYPE_ONLY_EDGE_DASH = '6 4';

const elk = new ELK();

interface EdgeBuildInfo {
  sourceRep: string;
  targetRep: string;
  typeOnly: boolean;
  valueCircular: boolean;
  typeOnlyCircular: boolean;
}

interface NodeSize {
  width: number;
  height: number;
}

function getLeafSizeForPath(path: string, visibleNodes: Map<string, 'folder' | 'file'>): NodeSize {
  const label = getBaseName(path);
  const kind = visibleNodes.get(path) === 'folder' ? 'folder' : 'file';

  return getLeafNodeSize(label, kind);
}

function toNodeDimensions(size: NodeSize): Pick<Node, 'width' | 'height' | 'style'> {
  return {
    width: size.width,
    height: size.height,
    style: { width: size.width, height: size.height },
  };
}

function applyNodeDimensions(node: Node, size: NodeSize): void {
  node.width = size.width;
  node.height = size.height;
  node.style = {
    ...node.style,
    width: size.width,
    height: size.height,
  };
}

function buildChildrenIndex(sources: string[]): Map<string, FolderChildren> {
  const index = new Map<string, { folders: Set<string>; files: Set<string> }>();

  function ensure(folder: string) {
    if (!index.has(folder)) {
      index.set(folder, { folders: new Set(), files: new Set() });
    }
    return index.get(folder)!;
  }

  for (const source of sources) {
    const parts = source.split('/');
    for (let i = 0; i < parts.length - 1; i++) {
      const folder = parts.slice(0, i + 1).join('/');
      if (i + 1 === parts.length - 1) {
        ensure(folder).files.add(source);
      } else {
        const subfolder = parts.slice(0, i + 2).join('/');
        ensure(folder).folders.add(subfolder);
      }
    }
  }

  const result = new Map<string, FolderChildren>();
  for (const [folder, children] of index) {
    result.set(folder, {
      folders: [...children.folders].sort(),
      files: [...children.files].sort(),
    });
  }
  return result;
}

function isFilePath(path: string, moduleSources: Set<string>): boolean {
  return moduleSources.has(path);
}

function isExpandedFolder(
  path: string,
  visibleNodes: Map<string, 'folder' | 'file'>,
  expandedFolders: Set<string>,
): boolean {
  return visibleNodes.get(path) === 'folder' && expandedFolders.has(path);
}

function hasSelectedDescendants(
  folderPath: string,
  selectedSet: Set<string>,
  childrenIndex: Map<string, FolderChildren>,
): boolean {
  if (selectedSet.has(folderPath)) return true;

  const children = childrenIndex.get(folderPath);
  if (!children) return false;

  for (const file of children.files) {
    if (selectedSet.has(file)) return true;
  }
  for (const subfolder of children.folders) {
    if (hasSelectedDescendants(subfolder, selectedSet, childrenIndex)) return true;
  }
  return false;
}

function collectCircularModules(modules: IModule[]): Set<string> {
  const circularModules = new Set<string>();
  for (const module of modules) {
    if (!Array.isArray(module.dependencies)) continue;
    if (module.dependencies.some(dep => dep.circular === true && !isTypeOnlyDependency(dep))) {
      circularModules.add(module.source);
    }
  }
  return circularModules;
}

function folderHasCircularDescendant(
  folderPath: string,
  selectedSet: Set<string>,
  childrenIndex: Map<string, FolderChildren>,
  circularModules: Set<string>,
): boolean {
  const children = childrenIndex.get(folderPath);
  if (!children) return false;

  for (const file of children.files) {
    if (selectedSet.has(file) && circularModules.has(file)) return true;
  }
  for (const subfolder of children.folders) {
    if (hasSelectedDescendants(subfolder, selectedSet, childrenIndex)) {
      if (folderHasCircularDescendant(subfolder, selectedSet, childrenIndex, circularModules)) {
        return true;
      }
    }
  }
  return false;
}

function getEffectiveRoot(path: string, selectedSet: Set<string>, childrenIndex: Map<string, FolderChildren>): string {
  let topmost = path;
  let current = path;
  let parent = getParentPath(current);

  while (parent && (selectedSet.has(parent) || hasSelectedDescendants(parent, selectedSet, childrenIndex))) {
    topmost = parent;
    current = parent;
    parent = getParentPath(current);
  }

  return topmost;
}

function getRootSelectedPaths(
  selectedPaths: string[],
  selectedSet: Set<string>,
  childrenIndex: Map<string, FolderChildren>,
): string[] {
  const roots = new Set<string>();
  for (const path of selectedPaths) {
    roots.add(getEffectiveRoot(path, selectedSet, childrenIndex));
  }
  return [...roots].sort();
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
      continue;
    }

    if (isFilePath(path, moduleSources)) {
      if (selectedSet.has(path)) {
        visibleNodes.set(path, 'file');
      }
      continue;
    }

    visibleNodes.set(path, 'folder');

    if (!expandedFolders.has(path)) continue;

    const children = childrenIndex.get(path);
    if (!children) continue;

    for (const subfolder of children.folders) {
      if (hasSelectedDescendants(subfolder, selectedSet, childrenIndex)) {
        collectVisibleNodes([subfolder], selectedSet, expandedFolders, moduleSources, childrenIndex, visibleNodes);
      }
    }

    for (const file of children.files) {
      if (selectedSet.has(file)) {
        visibleNodes.set(file, 'file');
      }
    }
  }
}

function buildParentByNode(
  visibleNodes: Map<string, 'folder' | 'file'>,
  expandedFolders: Set<string>,
): Map<string, string | null> {
  const parentByNode = new Map<string, string | null>();

  for (const path of visibleNodes.keys()) {
    const directParent = getParentPath(path);
    if (directParent && visibleNodes.has(directParent) && expandedFolders.has(directParent)) {
      parentByNode.set(path, directParent);
    } else {
      parentByNode.set(path, null);
    }
  }

  return parentByNode;
}

export function getDirectChildren(
  folderId: string | null,
  visibleNodeIds: ReadonlySet<string>,
  parentByNode: ReadonlyMap<string, string | null>,
): string[] {
  const children: string[] = [];
  for (const id of visibleNodeIds) {
    const parent = parentByNode.get(id) ?? null;
    if (parent === folderId) {
      children.push(id);
    }
  }
  return children.sort();
}

function getLayoutSpacing(childCount: number) {
  return {
    nodesep: Math.min(80, 24 + childCount * 2),
    ranksep: Math.min(160, 60 + childCount * 4),
  };
}

async function layoutChildrenWithElk(
  childIds: string[],
  childSizes: Map<string, NodeSize>,
  layoutEdges: LayoutEdge[],
): Promise<Map<string, { x: number; y: number }>> {
  const spacing = getLayoutSpacing(childIds.length);
  const childSet = new Set(childIds);
  const edges = layoutEdges
    .filter(edge => childSet.has(edge.source) && childSet.has(edge.target))
    .map((edge, index) => ({
      id: `e${index}-${edge.source}->${edge.target}`,
      sources: [edge.source],
      targets: [edge.target],
    }));

  const layouted = await elk.layout({
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.separateConnectedComponents': 'true',
      'elk.spacing.nodeNode': String(spacing.nodesep),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(spacing.ranksep),
    },
    children: childIds.map(childId => {
      const size = childSizes.get(childId)!;
      return { id: childId, width: size.width, height: size.height };
    }),
    edges,
  });

  const positions = new Map<string, { x: number; y: number }>();
  for (const child of layouted.children ?? []) {
    positions.set(child.id, {
      x: (child.x ?? 0) + GROUP_PADDING,
      y: (child.y ?? 0) + GROUP_HEADER + GROUP_PADDING,
    });
  }
  return positions;
}

function applyChildPositions(
  childIds: string[],
  childSizes: Map<string, NodeSize>,
  positions: Map<string, { x: number; y: number }>,
  folderId: string | null,
  nodeMap: Map<string, Node>,
  groupSizes: Map<string, NodeSize>,
): NodeSize {
  let maxX = 0;
  let maxY = 0;

  for (const childId of childIds) {
    const size = childSizes.get(childId)!;
    const position = positions.get(childId)!;
    const node = nodeMap.get(childId)!;
    node.position = position;
    if (folderId !== null) {
      node.parentId = folderId;
      node.extent = 'parent';
    }

    maxX = Math.max(maxX, position.x + size.width);
    maxY = Math.max(maxY, position.y + size.height);
  }

  const groupSize = {
    width: Math.max(maxX + GROUP_PADDING, LEAF_NODE_MIN_WIDTH + GROUP_PADDING * 2),
    height: Math.max(maxY + GROUP_PADDING, GROUP_HEADER + NODE_HEIGHT + GROUP_PADDING),
  };

  if (folderId !== null) {
    groupSizes.set(folderId, groupSize);
    const groupNode = nodeMap.get(folderId);
    if (groupNode) {
      applyNodeDimensions(groupNode, groupSize);
      groupNode.zIndex = -1;
    }
  }

  return groupSize;
}

/*
 * Layout algorithm (recursive, per folder level):
 *
 * 1. Collect direct children of the current folder (or root when folderId is null).
 * 2. Recurse into expanded subfolders first to compute their sizes.
 * 3. Place direct children with ELK layered (RIGHT). Spacing scales with child count.
 *    Disconnected components are packed separately (`elk.separateConnectedComponents`)
 *    so sparse sibling sets do not collapse into a single column.
 *
 * Only virtual layout edges between direct siblings at the current level influence layout.
 * Cross-group dependencies (e.g. file in src/foo -> file in src/bar) do not
 * affect positions — React Flow draws visual edges after layout.
 */
async function layoutGroup(
  folderId: string | null,
  nodeMap: Map<string, Node>,
  groupSizes: Map<string, NodeSize>,
  visibleNodes: Map<string, 'folder' | 'file'>,
  expandedFolders: Set<string>,
  visibleNodeIds: Set<string>,
  parentByNode: Map<string, string | null>,
  modules: readonly IModule[],
  selectedSet: Set<string>,
): Promise<NodeSize> {
  const childIds = getDirectChildren(folderId, visibleNodeIds, parentByNode);

  if (childIds.length === 0) {
    const emptySize = {
      width: LEAF_NODE_MIN_WIDTH + GROUP_PADDING * 2,
      height: GROUP_HEADER + NODE_HEIGHT + GROUP_PADDING * 2,
    };
    if (folderId !== null) {
      groupSizes.set(folderId, emptySize);
    }
    return emptySize;
  }

  const childSizes = new Map<string, NodeSize>();

  for (const childId of childIds) {
    if (isExpandedFolder(childId, visibleNodes, expandedFolders)) {
      const size = await layoutGroup(
        childId,
        nodeMap,
        groupSizes,
        visibleNodes,
        expandedFolders,
        visibleNodeIds,
        parentByNode,
        modules,
        selectedSet,
      );
      childSizes.set(childId, size);
    } else {
      childSizes.set(childId, getLeafSizeForPath(childId, visibleNodes));
    }
  }

  const layoutEdges = buildVirtualLayoutEdges(folderId, childIds, modules, selectedSet);
  const positions = await layoutChildrenWithElk(childIds, childSizes, layoutEdges);

  return applyChildPositions(childIds, childSizes, positions, folderId, nodeMap, groupSizes);
}

function sortNodesForReactFlow(nodes: Node[]): Node[] {
  const depthById = new Map<string, number>();

  function getDepth(id: string): number {
    const cached = depthById.get(id);
    if (cached !== undefined) return cached;

    const node = nodes.find(n => n.id === id);
    if (!node?.parentId) {
      depthById.set(id, 0);
      return 0;
    }

    const depth = getDepth(node.parentId) + 1;
    depthById.set(id, depth);
    return depth;
  }

  for (const node of nodes) {
    getDepth(node.id);
  }

  return [...nodes].sort((a, b) => (depthById.get(a.id) ?? 0) - (depthById.get(b.id) ?? 0));
}

export async function buildGraph({
  modules,
  selectedPaths,
  expandedFolders,
  folderColors,
  onToggleFolder,
  onExpandRecursive,
  onShowInFileTree,
  onShowDependencies,
}: BuildGraphInput): Promise<BuildGraphResult> {
  const selectedSet = new Set(selectedPaths);
  const moduleSources = new Set(modules.map(m => m.source));
  const childrenIndex = buildChildrenIndex(modules.map(m => m.source));
  const circularModules = collectCircularModules(modules);

  const visibleNodes = new Map<string, 'folder' | 'file'>();
  const roots = getRootSelectedPaths(selectedPaths, selectedSet, childrenIndex);
  collectVisibleNodes(roots, selectedSet, expandedFolders, moduleSources, childrenIndex, visibleNodes);

  const visibleNodeIds = new Set(visibleNodes.keys());
  const parentByNode = buildParentByNode(visibleNodes, expandedFolders);

  const edgeBuildMap = new Map<string, EdgeBuildInfo>();

  for (const module of modules) {
    if (!selectedSet.has(module.source)) continue;

    for (const dep of module.dependencies) {
      const resolved = dep.resolved;
      if (!resolved || !selectedSet.has(resolved)) continue;

      const sourceRep = getVisibleRepresentative(module.source, selectedSet, expandedFolders, visibleNodeIds);
      const targetRep = getVisibleRepresentative(resolved, selectedSet, expandedFolders, visibleNodeIds);

      if (sourceRep === targetRep) continue;
      if (!visibleNodeIds.has(sourceRep) || !visibleNodeIds.has(targetRep)) continue;

      const edgeKey = `${sourceRep}->${targetRep}`;
      const isTypeOnly = isTypeOnlyDependency(dep);
      const isCircular = dep.circular === true;
      const existing = edgeBuildMap.get(edgeKey);

      if (!existing) {
        edgeBuildMap.set(edgeKey, {
          sourceRep,
          targetRep,
          ...createDependencyRelationFlags(isTypeOnly, isCircular),
        });
      } else {
        mergeDependencyRelationFlags(existing, isTypeOnly, isCircular);
      }
    }
  }

  const edges: Edge[] = [];

  for (const [edgeKey, info] of edgeBuildMap) {
    finalizeDependencyRelationFlags(info);

    const { sourceRep, targetRep, typeOnly, valueCircular, typeOnlyCircular } = info;

    let stroke = DEFAULT_EDGE_COLOR;
    let strokeWidth = 1;
    if (valueCircular) {
      stroke = CIRCULAR_EDGE_COLOR;
      strokeWidth = 2;
    } else if (typeOnlyCircular) {
      stroke = TYPE_ONLY_CIRCULAR_EDGE_COLOR;
      strokeWidth = 2;
    }

    const style: Edge['style'] = { stroke, strokeWidth };
    if (typeOnly) {
      style.strokeDasharray = TYPE_ONLY_EDGE_DASH;
    }

    const titleSuffix = typeOnly ? ' (type-only)' : '';

    edges.push({
      id: edgeKey,
      type: 'dependency',
      source: sourceRep,
      target: targetRep,
      interactionWidth: 3,
      data: {
        title: `${sourceRep} → ${targetRep}${titleSuffix}`,
        typeOnly,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: stroke,
      },
      style,
    });
  }

  const nodeMap = new Map<string, Node>();
  const groupSizes = new Map<string, NodeSize>();

  for (const [path, type] of visibleNodes) {
    const parentId = parentByNode.get(path) ?? undefined;

    if (type === 'folder') {
      const expanded = expandedFolders.has(path);

      if (expanded) {
        const data: FolderGroupNodeData = {
          label: getBaseName(path),
          path,
          expanded: true,
          backgroundColor: folderColors.get(path) ?? 'rgba(0, 0, 0, 0.02)',
          onToggle: onToggleFolder,
          onExpandRecursive,
          onShowInFileTree,
          onShowDependencies,
        };
        nodeMap.set(path, {
          id: path,
          type: 'folderGroup',
          position: { x: 0, y: 0 },
          data,
          parentId,
          draggable: true,
          dragHandle: '.folder-group-header',
          extent: parentId ? 'parent' : undefined,
          zIndex: -1,
          style: { pointerEvents: 'none' },
        });
      } else {
        const label = getBaseName(path);
        const circular = folderHasCircularDescendant(path, selectedSet, childrenIndex, circularModules);
        const leafSize = getLeafNodeSize(label, 'folder');
        const data: FolderNodeData = {
          label,
          path,
          expanded: false,
          circular,
          backgroundColor: folderColors.get(path) ?? 'rgba(0, 0, 0, 0.02)',
          onToggle: onToggleFolder,
          onExpandRecursive,
          onShowInFileTree,
          onShowDependencies,
        };
        nodeMap.set(path, {
          id: path,
          type: 'folder',
          position: { x: 0, y: 0 },
          data,
          parentId,
          draggable: true,
          extent: parentId ? 'parent' : undefined,
          ...toNodeDimensions(leafSize),
        });
      }
    } else {
      const label = getBaseName(path);
      const leafSize = getLeafNodeSize(label, 'file');
      const data: FileNodeData = {
        label,
        path,
        circular: circularModules.has(path),
        onShowInFileTree,
        onShowDependencies,
      };
      nodeMap.set(path, {
        id: path,
        type: 'file',
        position: { x: 0, y: 0 },
        data,
        parentId,
        draggable: true,
        extent: parentId ? 'parent' : undefined,
        ...toNodeDimensions(leafSize),
      });
    }
  }

  await layoutGroup(
    null,
    nodeMap,
    groupSizes,
    visibleNodes,
    expandedFolders,
    visibleNodeIds,
    parentByNode,
    modules,
    selectedSet,
  );

  return {
    nodes: sortNodesForReactFlow([...nodeMap.values()]),
    edges,
    visibleNodeIds,
    parentByNode,
  };
}
