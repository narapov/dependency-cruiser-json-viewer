import type { Node } from '@xyflow/react';

import { getDirectChildren, GRID_GAP_X, GRID_GAP_Y, GROUP_HEADER, GROUP_PADDING } from '../../buildGraph';
import { sortNodesByDepth } from '../../sortNodesByDepth';
import { updateGroupCacheFromNodes } from '../applyPositionCache';
import { applyGroupSizeToNode, getNodeSizeFromNode, resolveGroupSize } from '../resolveGroupSize';
import type { GroupFingerprints, GroupId, NodeSize, PositionCache } from '../types';

function getGroupDepth(groupId: GroupId, parentByNode: ReadonlyMap<string, string | null>): number {
  if (groupId === null) {
    return 0;
  }

  let depth = 0;
  let current: string | null = groupId;
  while (current !== null) {
    depth++;
    current = parentByNode.get(current) ?? null;
  }
  return depth;
}

function nodesOverlap(
  aPos: { x: number; y: number },
  aSize: NodeSize,
  bPos: { x: number; y: number },
  bSize: NodeSize,
): boolean {
  return (
    aPos.x < bPos.x + bSize.width &&
    aPos.x + aSize.width > bPos.x &&
    aPos.y < bPos.y + bSize.height &&
    aPos.y + aSize.height > bPos.y
  );
}

function getFixedChildIdsInGroup(
  groupId: GroupId,
  parentByNode: ReadonlyMap<string, string | null>,
  fixedNodeIds?: ReadonlySet<string>,
): ReadonlySet<string> | undefined {
  if (!fixedNodeIds || fixedNodeIds.size === 0) {
    return undefined;
  }

  const childFixed = new Set([...fixedNodeIds].filter(id => (parentByNode.get(id) ?? null) === groupId));

  return childFixed.size > 0 ? childFixed : undefined;
}

function pushAwayFromFixedNodes(
  siblings: Node[],
  nodeById: Map<string, Node>,
  fixedNodeIds: ReadonlySet<string>,
): boolean {
  const indices = Array.from({ length: siblings.length }, (_, index) => index);
  return indices.reduce((changed, i) => {
    const current = siblings[i];
    if (fixedNodeIds.has(current.id)) {
      return changed;
    }

    const currentSize = getNodeSizeFromNode(current);
    const verticallyPushed = siblings.reduce(
      (position, fixed) => {
        if (!fixedNodeIds.has(fixed.id)) {
          return position;
        }

        const fixedSize = getNodeSizeFromNode(fixed);
        return nodesOverlap(position, currentSize, fixed.position, fixedSize)
          ? {
              x: position.x,
              y: fixed.position.y + fixedSize.height + GRID_GAP_Y,
              changed: true,
            }
          : position;
      },
      { ...current.position, changed: false },
    );
    const pushed = siblings.reduce((position, fixed) => {
      if (!fixedNodeIds.has(fixed.id)) {
        return position;
      }

      const fixedSize = getNodeSizeFromNode(fixed);
      return nodesOverlap(position, currentSize, fixed.position, fixedSize)
        ? {
            x: fixed.position.x + fixedSize.width + GRID_GAP_X,
            y: Math.max(position.y, fixed.position.y),
            changed: true,
          }
        : position;
    }, verticallyPushed);
    const { x, y } = pushed;

    if (x !== current.position.x || y !== current.position.y) {
      nodeById.set(current.id, { ...current, position: { x, y } });
      siblings[i] = nodeById.get(current.id)!;
      return true;
    }

    return changed || pushed.changed;
  }, false);
}

function checkHorizontalOverlapWithFixedNodes(
  fixedNodeIds: ReadonlySet<string> | undefined,
  siblings: Node[],
  index: number,
  nodeById: Map<string, Node>,
  x: number,
  y: number,
  size: NodeSize,
): { x: number; y: number; changed: boolean } {
  if (!fixedNodeIds || fixedNodeIds.size === 0) {
    return { x, y, changed: false };
  }

  return [...fixedNodeIds].reduce<{ x: number; y: number; changed: boolean }>(
    (result, fixedNodeId) => {
      const fixedIndex = siblings.findIndex(sibling => sibling.id === fixedNodeId);
      if (fixedIndex < 0 || fixedIndex < index) {
        return result;
      }

      const fixed = nodeById.get(fixedNodeId);
      if (!fixed) {
        return result;
      }

      const fixedSize = getNodeSizeFromNode(fixed);
      return nodesOverlap(result, size, fixed.position, fixedSize)
        ? {
            x: fixed.position.x + fixedSize.width + GRID_GAP_X,
            y: Math.max(result.y, fixed.position.y),
            changed: true,
          }
        : result;
    },
    { x, y, changed: false },
  );
}

function checkVerticalOverlapWithFixedNodes(
  fixedNodeIds: ReadonlySet<string> | undefined,
  siblings: Node[],
  index: number,
  nodeById: Map<string, Node>,
  x: number,
  y: number,
  size: NodeSize,
): { y: number; changed: boolean } {
  if (!fixedNodeIds || fixedNodeIds.size === 0) {
    return { y, changed: false };
  }

  return [...fixedNodeIds].reduce<{ y: number; changed: boolean }>(
    (result, fixedNodeId) => {
      const fixedIndex = siblings.findIndex(sibling => sibling.id === fixedNodeId);
      if (fixedIndex < 0 || fixedIndex < index) {
        return result;
      }

      const fixed = nodeById.get(fixedNodeId);
      if (!fixed) {
        return result;
      }

      const fixedSize = getNodeSizeFromNode(fixed);
      return nodesOverlap({ x, y: result.y }, size, fixed.position, fixedSize)
        ? {
            y: fixed.position.y + fixedSize.height + GRID_GAP_Y,
            changed: true,
          }
        : result;
    },
    { y, changed: false },
  );
}

function collectFixedNodesForReflow(
  nodes: readonly Node[],
  previousSizes: ReadonlyMap<string, NodeSize>,
  previousNodes: readonly Node[] | null,
  parentByNode: ReadonlyMap<string, string | null>,
): ReadonlySet<string> {
  const previousById = previousNodes ? new Map(previousNodes.map(node => [node.id, node])) : null;
  const expandedAtParent = nodes.reduce((expanded, node) => {
    const previous = previousById?.get(node.id);
    if (previous?.type !== 'folder' || node.type !== 'folderGroup') {
      return expanded;
    }

    const parentId = parentByNode.get(node.id) ?? null;
    const siblings = expanded.get(parentId) ?? [];
    siblings.push(node.id);
    expanded.set(parentId, siblings);
    return expanded;
  }, new Map<GroupId, string[]>());

  const expansionSets = [...expandedAtParent.values()].reduce(
    (sets, childIds) => {
      if (childIds.length === 1) {
        sets.fixed.add(childIds[0]);
      } else {
        childIds.reduce((multiExpandChildIds, childId) => multiExpandChildIds.add(childId), sets.multi);
      }
      return sets;
    },
    { fixed: new Set<string>(), multi: new Set<string>() },
  );

  return nodes.reduce((fixed, node) => {
    if (fixed.has(node.id) || expansionSets.multi.has(node.id)) {
      return fixed;
    }

    const previousSize = previousSizes.get(node.id);
    if (!previousSize) {
      return fixed;
    }

    const currentSize = getNodeSizeFromNode(node);
    if (currentSize.width > previousSize.width || currentSize.height > previousSize.height) {
      fixed.add(node.id);
    }
    return fixed;
  }, expansionSets.fixed);
}

function groupHasOverlappingSiblings(
  groupId: GroupId,
  nodeById: Map<string, Node>,
  parentByNode: ReadonlyMap<string, string | null>,
): boolean {
  const nodeIds = new Set(nodeById.keys());
  const childIds = getDirectChildren(groupId, nodeIds, parentByNode);
  if (childIds.length <= 1) {
    return false;
  }

  const siblings = childIds.map(id => nodeById.get(id)!);

  return siblings.some((sibling, i) => {
    const aSize = getNodeSizeFromNode(sibling);
    return siblings.some(
      (other, j) => j > i && nodesOverlap(sibling.position, aSize, other.position, getNodeSizeFromNode(other)),
    );
  });
}

function collectGroupsNeedingReflow(
  nodes: Node[],
  parentByNode: ReadonlyMap<string, string | null>,
  previousSizes: ReadonlyMap<string, NodeSize>,
  currentFingerprints: GroupFingerprints | null,
  previousFingerprints: GroupFingerprints | null,
): Set<GroupId> {
  const nodeById = new Map(nodes.map(node => [node.id, node]));

  const groups = nodes.reduce((changedGroups, node) => {
    const currentSize = getNodeSizeFromNode(node);
    const previousSize = previousSizes.get(node.id);
    if (previousSize && (previousSize.width !== currentSize.width || previousSize.height !== currentSize.height)) {
      changedGroups.add(node.parentId ?? null);
    }
    return changedGroups;
  }, new Set<GroupId>());

  if (previousFingerprints !== null && currentFingerprints !== null) {
    [...currentFingerprints].reduce((changedGroups, [groupId, fingerprint]) => {
      const previous = previousFingerprints.get(groupId);
      if (previous !== fingerprint) {
        changedGroups.add(groupId);
      }
      return changedGroups;
    }, groups);
  }

  if (currentFingerprints !== null) {
    [...currentFingerprints.keys()].reduce((changedGroups, groupId) => {
      if (groupHasOverlappingSiblings(groupId, nodeById, parentByNode)) {
        changedGroups.add(groupId);
      }
      return changedGroups;
    }, groups);
  }

  return groups;
}

function reflowSiblingsInGroup(
  groupId: GroupId,
  nodeById: Map<string, Node>,
  parentByNode: ReadonlyMap<string, string | null>,
  fixedNodeIds?: ReadonlySet<string>,
): boolean {
  const nodeIds = new Set(nodeById.keys());
  const childIds = getDirectChildren(groupId, nodeIds, parentByNode);
  if (childIds.length <= 1) {
    return false;
  }

  const childFixedIds = getFixedChildIdsInGroup(groupId, parentByNode, fixedNodeIds);

  const siblings = childIds
    .map(id => nodeById.get(id)!)
    .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);

  const initiallyChanged = childFixedIds ? pushAwayFromFixedNodes(siblings, nodeById, childFixedIds) : false;
  const indices = Array.from({ length: siblings.length }, (_, index) => index);

  // First pass: push down when siblings overlap.
  const verticallyChanged = indices.reduce((changed, i) => {
    const current = siblings[i];
    if (childFixedIds?.has(current.id)) {
      return changed;
    }

    const currentSize = getNodeSizeFromNode(current);
    const { x } = current.position;
    const verticalResult = siblings.slice(0, i).reduce(
      (result, other) => {
        const otherSize = getNodeSizeFromNode(other);
        return nodesOverlap({ x, y: result.y }, currentSize, other.position, otherSize)
          ? { y: other.position.y + otherSize.height + GRID_GAP_Y, changed: true }
          : result;
      },
      { y: current.position.y, changed: false },
    );

    const fixedCheck = checkVerticalOverlapWithFixedNodes(
      childFixedIds,
      siblings,
      i,
      nodeById,
      x,
      verticalResult.y,
      currentSize,
    );
    const y = fixedCheck.y;

    if (y !== current.position.y) {
      nodeById.set(current.id, {
        ...current,
        position: { x, y },
      });
      siblings[i] = nodeById.get(current.id)!;
      return true;
    }
    return changed || verticalResult.changed || fixedCheck.changed;
  }, initiallyChanged);

  // Second pass: push right when vertical overflow still causes overlap.
  return indices.reduce((changed, i) => {
    const current = siblings[i];
    if (childFixedIds?.has(current.id)) {
      return changed;
    }

    const currentSize = getNodeSizeFromNode(current);
    const horizontalResult = siblings.slice(0, i).reduce(
      (result, other) => {
        const otherSize = getNodeSizeFromNode(other);
        return nodesOverlap(result, currentSize, other.position, otherSize)
          ? {
              x: other.position.x + otherSize.width + GRID_GAP_X,
              y: Math.max(result.y, other.position.y),
              changed: true,
            }
          : result;
      },
      { ...current.position, changed: false },
    );

    const fixedCheck = checkHorizontalOverlapWithFixedNodes(
      childFixedIds,
      siblings,
      i,
      nodeById,
      horizontalResult.x,
      horizontalResult.y,
      currentSize,
    );
    const { x, y } = fixedCheck;

    if (x !== current.position.x || y !== current.position.y) {
      nodeById.set(current.id, {
        ...current,
        position: { x, y },
      });
      siblings[i] = nodeById.get(current.id)!;
      return true;
    }
    return changed || horizontalResult.changed || fixedCheck.changed;
  }, verticallyChanged);
}

function resizeFolderGroups(nodeById: Map<string, Node>, parentByNode: ReadonlyMap<string, string | null>): void {
  const folderGroupIds = [...nodeById.values()]
    .filter(node => node.type === 'folderGroup')
    .map(node => node.id)
    .sort((a, b) => getGroupDepth(b, parentByNode) - getGroupDepth(a, parentByNode));

  folderGroupIds.reduce<null>((result, groupId) => {
    const size = resolveGroupSize(groupId, [...nodeById.values()], parentByNode);
    const groupNode = nodeById.get(groupId);
    if (groupNode) {
      nodeById.set(groupId, applyGroupSizeToNode(groupNode, size));
    }
    return result;
  }, null);
}

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
  const nodeIds = new Set(nodes.map(node => node.id));
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

  // Ensure node order: parents before children.
  const depthById = new Map<string, number>();
  function getDepth(id: string): number {
    const cached = depthById.get(id);
    if (cached !== undefined) {
      return cached;
    }
    const node = nodeById.get(id);
    if (!node?.parentId) {
      depthById.set(id, 0);
      return 0;
    }
    const depth = getDepth(node.parentId) + 1;
    depthById.set(id, depth);
    return depth;
  }

  [...nodeIds].reduce<null>((result, id) => {
    getDepth(id);
    return result;
  }, null);

  return [...nodeById.values()].sort((a, b) => (depthById.get(a.id) ?? 0) - (depthById.get(b.id) ?? 0));
}

function getAncestorFolderGroupIds(
  nodeId: string,
  nodeById: Map<string, Node>,
  parentByNode: ReadonlyMap<string, string | null>,
): string[] {
  const ancestorGroupIds: string[] = [];
  let current: string | null = parentByNode.get(nodeId) ?? null;

  while (current !== null) {
    const groupNode = nodeById.get(current);
    if (groupNode?.type === 'folderGroup') {
      ancestorGroupIds.push(current);
    }
    current = parentByNode.get(current) ?? null;
  }

  return ancestorGroupIds.sort((a, b) => getGroupDepth(b, parentByNode) - getGroupDepth(a, parentByNode));
}

function resizeAncestorGroups(
  nodeById: Map<string, Node>,
  parentByNode: ReadonlyMap<string, string | null>,
  nodeId: string,
): void {
  getAncestorFolderGroupIds(nodeId, nodeById, parentByNode).reduce<null>((result, groupId) => {
    const size = resolveGroupSize(groupId, [...nodeById.values()], parentByNode);
    const groupNode = nodeById.get(groupId);
    if (groupNode) {
      nodeById.set(groupId, applyGroupSizeToNode(groupNode, size));
    }
    return result;
  }, null);
}

function hasSizeGrown(
  nodeId: string,
  nodeById: Map<string, Node>,
  previousSizes: ReadonlyMap<string, NodeSize>,
): boolean {
  const node = nodeById.get(nodeId);
  const previousSize = previousSizes.get(nodeId);
  if (!node || !previousSize) {
    return false;
  }

  const currentSize = getNodeSizeFromNode(node);
  return currentSize.width > previousSize.width || currentSize.height > previousSize.height;
}

function compactGroupChildren(
  groupId: GroupId,
  nodeById: Map<string, Node>,
  parentByNode: ReadonlyMap<string, string | null>,
): boolean {
  const nodeIds = new Set(nodeById.keys());
  const childIds = getDirectChildren(groupId, nodeIds, parentByNode);
  if (childIds.length === 0) {
    return false;
  }

  const minimums = childIds.reduce(
    (currentMinimums, childId) => {
      const child = nodeById.get(childId);
      return child
        ? {
            minX: Math.min(currentMinimums.minX, child.position.x),
            minY: Math.min(currentMinimums.minY, child.position.y),
          }
        : currentMinimums;
    },
    { minX: Infinity, minY: Infinity },
  );

  const shiftX = GROUP_PADDING - minimums.minX;
  const shiftY = GROUP_HEADER + GROUP_PADDING - minimums.minY;
  if (shiftX === 0 && shiftY === 0) {
    return false;
  }

  childIds.reduce<null>((result, childId) => {
    const child = nodeById.get(childId);
    if (!child) {
      return result;
    }
    nodeById.set(childId, {
      ...child,
      position: {
        x: child.position.x + shiftX,
        y: child.position.y + shiftY,
      },
    });
    return result;
  }, null);

  return true;
}

function collectGroupsToCompact(
  draggedNodeId: string,
  nodeById: Map<string, Node>,
  parentByNode: ReadonlyMap<string, string | null>,
): GroupId[] {
  const groups = new Set<GroupId>();

  let current: string | null = parentByNode.get(draggedNodeId) ?? null;
  while (true) {
    groups.add(current);
    if (current === null) {
      break;
    }
    current = parentByNode.get(current) ?? null;
  }

  const draggedNode = nodeById.get(draggedNodeId);
  if (draggedNode?.type === 'folderGroup') {
    groups.add(draggedNodeId);
  }

  return [...groups].sort((a, b) => getGroupDepth(b, parentByNode) - getGroupDepth(a, parentByNode));
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
  return new Map(nodes.map(node => [node.id, getNodeSizeFromNode(node)]));
}
