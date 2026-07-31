import type { IModule } from 'dependency-cruiser';
import ELK from 'elkjs/lib/elk.bundled.js';

import type { Node } from '@xyflow/react';

import { buildVirtualLayoutEdges, type LayoutEdge } from '../../buildVirtualLayoutEdges';
import { LEAF_NODE_HEIGHT, LEAF_NODE_MIN_WIDTH } from '../../getLeafNodeSize';
import type { BuildGraphProfiler } from '../createBuildGraphProfiler';
import { getDirectChildren } from '../getDirectChildren';
import { GROUP_HEADER, GROUP_PADDING } from '../layoutConstants';
import { applyNodeDimensions, getLeafSizeForPath } from '../nodeDimensions';
import type { NodeSize } from '../types';

const NODE_HEIGHT = LEAF_NODE_HEIGHT;

const elk = new ELK();

function isExpandedFolder(
  path: string,
  visibleNodes: Map<string, 'folder' | 'file'>,
  expandedFolders: Set<string>,
): boolean {
  return visibleNodes.get(path) === 'folder' && expandedFolders.has(path);
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
  profiler?: BuildGraphProfiler,
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

  profiler?.start('elk.layout');
  const layouted = await elk.layout({
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.edgeRouting': 'SPLINES',
      'elk.separateConnectedComponents': 'true',
      //'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.spacing.nodeNode': String(spacing.nodesep),
      'elk.spacing.edgeNode': String(Math.max(12, spacing.nodesep * 0.4)),
      'elk.spacing.edgeEdge': '10',
      'elk.layered.spacing.nodeNodeBetweenLayers': String(spacing.ranksep),
      'elk.layered.spacing.edgeNodeBetweenLayers': String(Math.max(16, spacing.ranksep * 0.25)),
    },
    children: childIds.map(childId => {
      const size = childSizes.get(childId)!;
      return { id: childId, width: size.width, height: size.height };
    }),
    edges,
  });
  profiler?.end('elk.layout');

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

/**
 * Recursively layout for folder group (or root) with ELK and updates node sizes.
 *
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
export async function layoutGroup(
  folderId: string | null,
  nodeMap: Map<string, Node>,
  groupSizes: Map<string, NodeSize>,
  visibleNodes: Map<string, 'folder' | 'file'>,
  expandedFolders: Set<string>,
  visibleNodeIds: Set<string>,
  parentByNode: Map<string, string | null>,
  modules: readonly IModule[],
  selectedSet: Set<string>,
  profiler?: BuildGraphProfiler,
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
        profiler,
      );
      childSizes.set(childId, size);
    } else {
      childSizes.set(childId, getLeafSizeForPath(childId, visibleNodes));
    }
  }

  const layoutEdges = buildVirtualLayoutEdges(folderId, childIds, modules, selectedSet);
  const positions = await layoutChildrenWithElk(childIds, childSizes, layoutEdges, profiler);

  return applyChildPositions(childIds, childSizes, positions, folderId, nodeMap, groupSizes);
}
