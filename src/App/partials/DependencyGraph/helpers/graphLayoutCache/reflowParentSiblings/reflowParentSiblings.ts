import type { Node } from '@xyflow/react';

import { sortNodesByDepth } from '../../sortNodesByDepth';
import { updateGroupCacheFromNodes } from '../applyPositionCache';
import { collectFixedNodesForReflow } from '../collectFixedNodesForReflow';
import { collectGroupsNeedingReflow, groupHasOverlappingSiblings } from '../collectGroupsNeedingReflow';
import { collectGroupsToCompact, compactGroupChildren } from '../compactGroupChildren';
import { getGroupDepth } from '../getGroupDepth';
import { reflowSiblingsInGroup } from '../reflowSiblingsInGroup';
import {
  getAncestorFolderGroupIds,
  hasSizeGrown,
  resizeAncestorGroups,
  resizeFolderGroups,
} from '../resizeFolderGroups';
import { getNodeSize } from '../resolveGroupSize';
import type { GroupFingerprints, GroupId, NodeSize, PositionCache } from '../types';

const MIN_REFLOW_ITERATIONS_CAP = 8;

/** Inputs for sibling reflow after size or membership changes. */
export interface ReflowInput {
  nodes: Node[];
  parentByNode: ReadonlyMap<string, string | null>;
  previousSizes: ReadonlyMap<string, NodeSize>;
  cache: PositionCache;
  currentFingerprints?: GroupFingerprints | null;
  previousFingerprints?: GroupFingerprints | null;
  previousNodes?: readonly Node[] | null;
}

function collectKnownGroupIds(
  nodeById: Map<string, Node>,
  parentByNode: ReadonlyMap<string, string | null>,
): Set<GroupId> {
  return [...nodeById.values()].reduce((groups, node) => {
    groups.add(parentByNode.get(node.id) ?? null);
    if (node.type === 'folderGroup') {
      groups.add(node.id);
    }
    return groups;
  }, new Set<GroupId>());
}

function collectGroupsWithOverlaps(
  nodeById: Map<string, Node>,
  parentByNode: ReadonlyMap<string, string | null>,
): Set<GroupId> {
  return [...collectKnownGroupIds(nodeById, parentByNode)].reduce((groups, groupId) => {
    if (groupHasOverlappingSiblings(groupId, nodeById, parentByNode)) {
      groups.add(groupId);
    }
    return groups;
  }, new Set<GroupId>());
}

function snapshotFolderGroupSizes(nodeById: Map<string, Node>): Map<string, NodeSize> {
  return [...nodeById.values()].reduce((sizes, node) => {
    if (node.type === 'folderGroup') {
      sizes.set(node.id, getNodeSize(node));
    }
    return sizes;
  }, new Map<string, NodeSize>());
}

function collectParentsOfGrownGroups(
  beforeSizes: ReadonlyMap<string, NodeSize>,
  nodeById: Map<string, Node>,
  parentByNode: ReadonlyMap<string, string | null>,
): Set<GroupId> {
  return [...beforeSizes].reduce((parents, [groupId, beforeSize]) => {
    const node = nodeById.get(groupId);
    if (!node) {
      return parents;
    }

    const afterSize = getNodeSize(node);
    if (afterSize.width !== beforeSize.width || afterSize.height !== beforeSize.height) {
      parents.add(parentByNode.get(groupId) ?? null);
    }
    return parents;
  }, new Set<GroupId>());
}

function maxGroupDepth(nodeById: Map<string, Node>, parentByNode: ReadonlyMap<string, string | null>): number {
  return [...nodeById.values()].reduce((maxDepth, node) => {
    if (node.type !== 'folderGroup') {
      return maxDepth;
    }
    return Math.max(maxDepth, getGroupDepth(node.id, parentByNode));
  }, 0);
}

/** Separates overlapping siblings and resizes ancestor folder groups as needed. */
export function reflowParentSiblings({
  nodes,
  parentByNode,
  previousSizes,
  cache,
  currentFingerprints = null,
  previousFingerprints = null,
  previousNodes = null,
}: ReflowInput): Node[] {
  const nodeById = new Map(nodes.map(node => [node.id, { ...node }]));
  resizeFolderGroups(nodeById, parentByNode);
  const syncedNodes = sortNodesByDepth([...nodeById.values()]);

  const fixedNodeIds = collectFixedNodesForReflow(syncedNodes, previousSizes, previousNodes, parentByNode);

  let groupsToReflow = collectGroupsNeedingReflow(
    syncedNodes,
    parentByNode,
    previousSizes,
    currentFingerprints,
    previousFingerprints,
  );

  if (groupsToReflow.size === 0) {
    return syncedNodes;
  }

  const maxIterations = Math.max(MIN_REFLOW_ITERATIONS_CAP, maxGroupDepth(nodeById, parentByNode) + 2);

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const sortedGroups = [...groupsToReflow].sort(
      (a, b) => getGroupDepth(b, parentByNode) - getGroupDepth(a, parentByNode),
    );

    const anyReflow = sortedGroups.reduce((changed, groupId) => {
      const reflowed = reflowSiblingsInGroup(groupId, nodeById, parentByNode, fixedNodeIds);
      if (reflowed) {
        updateGroupCacheFromNodes(cache, [...nodeById.values()], parentByNode, groupId);
      }
      return changed || reflowed;
    }, false);

    const sizesBeforeResize = snapshotFolderGroupSizes(nodeById);
    resizeFolderGroups(nodeById, parentByNode);
    const grownParents = collectParentsOfGrownGroups(sizesBeforeResize, nodeById, parentByNode);
    const overlappingGroups = collectGroupsWithOverlaps(nodeById, parentByNode);

    groupsToReflow = new Set([...grownParents, ...overlappingGroups]);

    if (!anyReflow && grownParents.size === 0) {
      break;
    }
  }

  return sortNodesByDepth([...nodeById.values()]);
}

/** Shifts children so the dragged node's groups hug their content padding again. */
export function compactAfterDrag(
  nodes: Node[],
  parentByNode: ReadonlyMap<string, string | null>,
  draggedNodeId: string,
): Node[] {
  const nodeById = new Map(nodes.map(node => [node.id, { ...node }]));

  collectGroupsToCompact(draggedNodeId, nodeById, parentByNode).forEach(groupId => {
    compactGroupChildren(groupId, nodeById, parentByNode);
  });

  resizeFolderGroups(nodeById, parentByNode);

  return sortNodesByDepth([...nodeById.values()]);
}

/** Places a dragged node and reflows siblings so fixed content does not overlap. */
export function reflowForDrag(
  nodes: Node[],
  parentByNode: ReadonlyMap<string, string | null>,
  draggedNodeId: string,
  draggedPosition: { x: number; y: number },
  previousSizes: ReadonlyMap<string, NodeSize>,
): Node[] {
  const nodeById = new Map(nodes.map(node => [node.id, { ...node }]));

  const dragged = nodeById.get(draggedNodeId);
  if (dragged) {
    nodeById.set(draggedNodeId, { ...dragged, position: { ...draggedPosition } });
  }

  const fixedNodeIds = new Set([draggedNodeId]);
  const groupId = parentByNode.get(draggedNodeId) ?? null;
  reflowSiblingsInGroup(groupId, nodeById, parentByNode, fixedNodeIds);
  resizeAncestorGroups(nodeById, parentByNode, draggedNodeId);

  getAncestorFolderGroupIds(draggedNodeId, nodeById, parentByNode).forEach(ancestorId => {
    if (!hasSizeGrown(ancestorId, nodeById, previousSizes)) {
      return;
    }

    const parentGroupId = parentByNode.get(ancestorId) ?? null;
    reflowSiblingsInGroup(parentGroupId, nodeById, parentByNode, new Set([ancestorId]));
    resizeFolderGroups(nodeById, parentByNode);
  });

  return sortNodesByDepth([...nodeById.values()]);
}

/** Snapshot of each node's width and height keyed by id. */
export function collectNodeSizes(nodes: readonly Node[]): Map<string, NodeSize> {
  return new Map(nodes.map(node => [node.id, getNodeSize(node)]));
}
