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
      layoutOptions: {
        // How important it is to keep this edge axis-aligned. int ≥ 0; higher = straighter.
        'elk.layered.priority.straightness': String(edge.weight),
        // How important it is to keep this edge short. int ≥ 0; higher = prefer shorter routes.
        'elk.layered.priority.shortness': String(edge.weight),
      },
    }));

  profiler?.start('elk.layout');
  const layouted = await elk.layout({
    id: 'root',
    layoutOptions: {
      // Layout algorithm. We use layered (Sugiyama); other ELK algorithms exist (e.g. force, mrtree).
      'elk.algorithm': 'layered',
      // Overall edge flow direction. Values: UNDEFINED | RIGHT | LEFT | DOWN | UP.
      'elk.direction': 'RIGHT',
      // Edge routing style. Values: UNDEFINED | POLYLINE | ORTHOGONAL | SPLINES.
      'elk.edgeRouting': 'SPLINES',
      // Layout disconnected subgraphs separately. Values: true | false.
      'elk.separateConnectedComponents': 'true',
      // Crossing minimization heuristic. Values: LAYER_SWEEP | MEDIAN_LAYER_SWEEP | INTERACTIVE | NONE.
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      // Post-process swap heuristic after layer sweep. Values: ONE_SIDED | TWO_SIDED | OFF.
      'elk.layered.crossingMinimization.greedySwitch.type': 'TWO_SIDED',
      // Run greedy switch only if graph size < threshold. int ≥ 0; 0 = always on. Default: 40.
      'elk.layered.crossingMinimization.greedySwitch.activationThreshold': '0',
      // Brandes–Köpf fixed alignment. Values: NONE | LEFTUP | RIGHTUP | LEFTDOWN | RIGHTDOWN | BALANCED.
      'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
      // Extra edge straightening in BK placer. Values: NONE | IMPROVE_STRAIGHTNESS.
      'elk.layered.nodePlacement.bk.edgeStraightening': 'IMPROVE_STRAIGHTNESS',
      // Prefer straight edges over balanced placement. Values: true | false.
      'elk.layered.nodePlacement.favorStraightEdges': 'true',
      // Layout effort / iteration budget. int ≥ 1; default 7.
      'elk.layered.thoroughness': '10',
      // Spacing between nodes in the same layer (vertical when direction is RIGHT).
      'elk.spacing.nodeNode': String(spacing.nodesep),
      // Spacing between edges and nodes.
      'elk.spacing.edgeNode': String(Math.max(12, spacing.nodesep * 0.4)),
      // Spacing between parallel edges.
      'elk.spacing.edgeEdge': '10',
      // Spacing between adjacent layers (horizontal when direction is RIGHT).
      'elk.layered.spacing.nodeNodeBetweenLayers': String(spacing.ranksep),
      // Spacing between edges and nodes across layers.
      'elk.layered.spacing.edgeNodeBetweenLayers': String(Math.max(16, spacing.ranksep * 0.25)),
    },
    children: childIds.map(childId => {
      const size = childSizes.get(childId)!;
      return { id: childId, width: size.width, height: size.height };
    }),
    edges,
  });
  profiler?.end('elk.layout');

  return new Map(
    (layouted.children ?? []).map(child => [
      child.id,
      {
        x: (child.x ?? 0) + GROUP_PADDING,
        y: (child.y ?? 0) + GROUP_HEADER + GROUP_PADDING,
      },
    ]),
  );
}

function applyChildPositions(
  childIds: string[],
  childSizes: Map<string, NodeSize>,
  positions: Map<string, { x: number; y: number }>,
  folderId: string | null,
  nodeMap: Map<string, Node>,
  groupSizes: Map<string, NodeSize>,
): NodeSize {
  const { maxX, maxY } = childIds.reduce(
    (bounds, childId) => {
      const size = childSizes.get(childId)!;
      const position = positions.get(childId)!;
      const node = nodeMap.get(childId)!;
      node.position = position;
      if (folderId !== null) {
        node.parentId = folderId;
        node.extent = 'parent';
      }

      return {
        maxX: Math.max(bounds.maxX, position.x + size.width),
        maxY: Math.max(bounds.maxY, position.y + size.height),
      };
    },
    { maxX: 0, maxY: 0 },
  );

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
 * Edge weight (dependency count) biases crossing minimization and straightness.
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

  const childSizes = await childIds.reduce<Promise<Map<string, NodeSize>>>(async (accPromise, childId) => {
    const acc = await accPromise;
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
      acc.set(childId, size);
    } else {
      acc.set(childId, getLeafSizeForPath(childId, visibleNodes));
    }
    return acc;
  }, Promise.resolve(new Map<string, NodeSize>()));

  const layoutEdges = buildVirtualLayoutEdges(folderId, childIds, modules, selectedSet);
  const positions = await layoutChildrenWithElk(childIds, childSizes, layoutEdges, profiler);

  return applyChildPositions(childIds, childSizes, positions, folderId, nodeMap, groupSizes);
}
