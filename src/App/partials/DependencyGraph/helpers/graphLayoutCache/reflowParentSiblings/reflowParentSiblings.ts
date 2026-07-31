import type { Node } from '@xyflow/react';

import { sortNodesByDepth } from '../../sortNodesByDepth';
import { updateGroupCacheFromNodes } from '../applyPositionCache';
import { collectFixedNodesForReflow } from '../collectFixedNodesForReflow';
import { collectGroupsNeedingReflow } from '../collectGroupsNeedingReflow';
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
  const fixedNodeIds = collectFixedNodesForReflow(nodes, previousSizes, previousNodes, parentByNode);

  const groupsToReflow = collectGroupsNeedingReflow(
    nodes,
    parentByNode,
    previousSizes,
    currentFingerprints,
    previousFingerprints,
  );

  if (groupsToReflow.size === 0) {
    return nodes;
  }

  const sortedGroups = [...groupsToReflow].sort(
    (a, b) => getGroupDepth(b, parentByNode) - getGroupDepth(a, parentByNode),
  );

  sortedGroups.reduce<null>((result, groupId) => {
    reflowSiblingsInGroup(groupId, nodeById, parentByNode, fixedNodeIds);
    const updatedNodes = [...nodeById.values()];
    updateGroupCacheFromNodes(cache, updatedNodes, parentByNode, groupId);
    return result;
  }, null);

  resizeFolderGroups(nodeById, parentByNode);

  // Propagate size changes up: if a folderGroup resized, reflow its parent too.
  const parentGroupsToReflow = sortedGroups.reduce((parentGroups, groupId) => {
    if (groupId !== null) {
      parentGroups.add(parentByNode.get(groupId) ?? null);
    }
    return parentGroups;
  }, new Set<GroupId>());

  const sortedParentGroups = [...parentGroupsToReflow].sort(
    (a, b) => getGroupDepth(b, parentByNode) - getGroupDepth(a, parentByNode),
  );

  sortedParentGroups.reduce<null>((result, groupId) => {
    if (groupId === null && sortedGroups.includes(null)) {
      return result;
    }
    reflowSiblingsInGroup(groupId, nodeById, parentByNode, fixedNodeIds);
    const updatedNodes = [...nodeById.values()];
    updateGroupCacheFromNodes(cache, updatedNodes, parentByNode, groupId);
    return result;
  }, null);

  resizeFolderGroups(nodeById, parentByNode);

  return sortNodesByDepth([...nodeById.values()]);
}

/** Shifts children so the dragged node's groups hug their content padding again. */
export function compactAfterDrag(
  nodes: Node[],
  parentByNode: ReadonlyMap<string, string | null>,
  draggedNodeId: string,
): Node[] {
  const nodeById = new Map(nodes.map(node => [node.id, { ...node }]));

  collectGroupsToCompact(draggedNodeId, nodeById, parentByNode).reduce<null>((result, groupId) => {
    compactGroupChildren(groupId, nodeById, parentByNode);
    return result;
  }, null);

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

  getAncestorFolderGroupIds(draggedNodeId, nodeById, parentByNode).reduce<null>((result, ancestorId) => {
    if (!hasSizeGrown(ancestorId, nodeById, previousSizes)) {
      return result;
    }

    const parentGroupId = parentByNode.get(ancestorId) ?? null;
    reflowSiblingsInGroup(parentGroupId, nodeById, parentByNode, new Set([ancestorId]));
    resizeFolderGroups(nodeById, parentByNode);
    return result;
  }, null);

  return sortNodesByDepth([...nodeById.values()]);
}

/** Snapshot of each node's width and height keyed by id. */
export function collectNodeSizes(nodes: readonly Node[]): Map<string, NodeSize> {
  return new Map(nodes.map(node => [node.id, getNodeSize(node)]));
}
