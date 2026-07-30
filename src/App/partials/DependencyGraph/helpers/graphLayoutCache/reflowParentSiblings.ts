import type { Node } from '@xyflow/react';

import { getDirectChildren, GRID_GAP_X, GRID_GAP_Y, GROUP_HEADER, GROUP_PADDING } from '../buildGraph';
import { sortNodesByDepth } from '../sortNodesByDepth';
import { updateGroupCacheFromNodes } from './applyPositionCache';
import { applyGroupSizeToNode, getNodeSizeFromNode, resolveGroupSize } from './resolveGroupSize';
import type { GroupFingerprints, GroupId, NodeSize, PositionCache } from './types';

function getGroupDepth(groupId: GroupId, parentByNode: ReadonlyMap<string, string | null>): number {
  if (groupId === null) return 0;

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
  if (!fixedNodeIds || fixedNodeIds.size === 0) return undefined;

  const childFixed = new Set<string>();
  for (const id of fixedNodeIds) {
    if ((parentByNode.get(id) ?? null) === groupId) {
      childFixed.add(id);
    }
  }

  return childFixed.size > 0 ? childFixed : undefined;
}

function pushAwayFromFixedNodes(
  siblings: Node[],
  nodeById: Map<string, Node>,
  fixedNodeIds: ReadonlySet<string>,
): boolean {
  let changed = false;

  for (let i = 0; i < siblings.length; i++) {
    const current = siblings[i];
    if (fixedNodeIds.has(current.id)) continue;

    const currentSize = getNodeSizeFromNode(current);
    let { x, y } = current.position;

    for (const fixed of siblings) {
      if (!fixedNodeIds.has(fixed.id)) continue;

      const fixedSize = getNodeSizeFromNode(fixed);
      if (nodesOverlap({ x, y }, currentSize, fixed.position, fixedSize)) {
        y = fixed.position.y + fixedSize.height + GRID_GAP_Y;
        changed = true;
      }
    }

    for (const fixed of siblings) {
      if (!fixedNodeIds.has(fixed.id)) continue;

      const fixedSize = getNodeSizeFromNode(fixed);
      if (nodesOverlap({ x, y }, currentSize, fixed.position, fixedSize)) {
        x = fixed.position.x + fixedSize.width + GRID_GAP_X;
        y = Math.max(y, fixed.position.y);
        changed = true;
      }
    }

    if (x !== current.position.x || y !== current.position.y) {
      nodeById.set(current.id, { ...current, position: { x, y } });
      siblings[i] = nodeById.get(current.id)!;
      changed = true;
    }
  }

  return changed;
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

  let changed = false;

  for (const fixedNodeId of fixedNodeIds) {
    const fixedIndex = siblings.findIndex(sibling => sibling.id === fixedNodeId);
    if (fixedIndex < 0 || fixedIndex < index) continue;

    const fixed = nodeById.get(fixedNodeId);
    if (!fixed) continue;

    const fixedSize = getNodeSizeFromNode(fixed);
    if (nodesOverlap({ x, y }, size, fixed.position, fixedSize)) {
      x = fixed.position.x + fixedSize.width + GRID_GAP_X;
      y = Math.max(y, fixed.position.y);
      changed = true;
    }
  }

  return { x, y, changed };
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

  let changed = false;

  for (const fixedNodeId of fixedNodeIds) {
    const fixedIndex = siblings.findIndex(sibling => sibling.id === fixedNodeId);
    if (fixedIndex < 0 || fixedIndex < index) continue;

    const fixed = nodeById.get(fixedNodeId);
    if (!fixed) continue;

    const fixedSize = getNodeSizeFromNode(fixed);
    if (nodesOverlap({ x, y }, size, fixed.position, fixedSize)) {
      y = fixed.position.y + fixedSize.height + GRID_GAP_Y;
      changed = true;
    }
  }

  return { y, changed };
}

function collectFixedNodesForReflow(
  nodes: readonly Node[],
  previousSizes: ReadonlyMap<string, NodeSize>,
  previousNodes: readonly Node[] | null,
  parentByNode: ReadonlyMap<string, string | null>,
): ReadonlySet<string> {
  const fixed = new Set<string>();
  const previousById = previousNodes ? new Map(previousNodes.map(node => [node.id, node])) : null;
  const expandedAtParent = new Map<GroupId, string[]>();

  for (const node of nodes) {
    const previous = previousById?.get(node.id);
    if (previous?.type === 'folder' && node.type === 'folderGroup') {
      const parentId = parentByNode.get(node.id) ?? null;
      const siblings = expandedAtParent.get(parentId) ?? [];
      siblings.push(node.id);
      expandedAtParent.set(parentId, siblings);
    }
  }

  const multiExpandChildIds = new Set<string>();
  for (const childIds of expandedAtParent.values()) {
    if (childIds.length === 1) {
      fixed.add(childIds[0]);
    } else {
      for (const childId of childIds) {
        multiExpandChildIds.add(childId);
      }
    }
  }

  for (const node of nodes) {
    if (fixed.has(node.id) || multiExpandChildIds.has(node.id)) continue;

    const previousSize = previousSizes.get(node.id);
    if (!previousSize) continue;

    const currentSize = getNodeSizeFromNode(node);
    if (currentSize.width > previousSize.width || currentSize.height > previousSize.height) {
      fixed.add(node.id);
    }
  }

  return fixed;
}

function groupHasOverlappingSiblings(
  groupId: GroupId,
  nodeById: Map<string, Node>,
  parentByNode: ReadonlyMap<string, string | null>,
): boolean {
  const nodeIds = new Set(nodeById.keys());
  const childIds = getDirectChildren(groupId, nodeIds, parentByNode);
  if (childIds.length <= 1) return false;

  const siblings = childIds.map(id => nodeById.get(id)!);

  for (let i = 0; i < siblings.length; i++) {
    const aSize = getNodeSizeFromNode(siblings[i]);
    for (let j = i + 1; j < siblings.length; j++) {
      const bSize = getNodeSizeFromNode(siblings[j]);
      if (nodesOverlap(siblings[i].position, aSize, siblings[j].position, bSize)) {
        return true;
      }
    }
  }

  return false;
}

function collectGroupsNeedingReflow(
  nodes: Node[],
  parentByNode: ReadonlyMap<string, string | null>,
  previousSizes: ReadonlyMap<string, NodeSize>,
  currentFingerprints: GroupFingerprints | null,
  previousFingerprints: GroupFingerprints | null,
): Set<GroupId> {
  const groups = new Set<GroupId>();
  const nodeById = new Map(nodes.map(node => [node.id, node]));

  for (const node of nodes) {
    const currentSize = getNodeSizeFromNode(node);
    const previousSize = previousSizes.get(node.id);
    if (previousSize && (previousSize.width !== currentSize.width || previousSize.height !== currentSize.height)) {
      groups.add(node.parentId ?? null);
    }
  }

  if (previousFingerprints !== null && currentFingerprints !== null) {
    for (const [groupId, fingerprint] of currentFingerprints) {
      const previous = previousFingerprints.get(groupId);
      if (previous !== fingerprint) {
        groups.add(groupId);
      }
    }
  }

  if (currentFingerprints !== null) {
    for (const groupId of currentFingerprints.keys()) {
      if (groupHasOverlappingSiblings(groupId, nodeById, parentByNode)) {
        groups.add(groupId);
      }
    }
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
  if (childIds.length <= 1) return false;

  const childFixedIds = getFixedChildIdsInGroup(groupId, parentByNode, fixedNodeIds);

  const siblings = childIds
    .map(id => nodeById.get(id)!)
    .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);

  let changed = false;

  if (childFixedIds) {
    changed = pushAwayFromFixedNodes(siblings, nodeById, childFixedIds) || changed;
  }

  // First pass: push down when siblings overlap.
  for (let i = 0; i < siblings.length; i++) {
    const current = siblings[i];
    if (childFixedIds?.has(current.id)) continue;

    const currentSize = getNodeSizeFromNode(current);
    const { x } = current.position;
    let { y } = current.position;

    for (let j = 0; j < i; j++) {
      const other = siblings[j];
      const otherSize = getNodeSizeFromNode(other);

      if (nodesOverlap({ x, y }, currentSize, other.position, otherSize)) {
        y = other.position.y + otherSize.height + GRID_GAP_Y;
        changed = true;
      }
    }

    const fixedCheck = checkVerticalOverlapWithFixedNodes(childFixedIds, siblings, i, nodeById, x, y, currentSize);
    y = fixedCheck.y;
    if (fixedCheck.changed) changed = true;

    if (y !== current.position.y) {
      nodeById.set(current.id, {
        ...current,
        position: { x, y },
      });
      siblings[i] = nodeById.get(current.id)!;
      changed = true;
    }
  }

  // Second pass: push right when vertical overflow still causes overlap.
  for (let i = 0; i < siblings.length; i++) {
    const current = siblings[i];
    if (childFixedIds?.has(current.id)) continue;

    const currentSize = getNodeSizeFromNode(current);
    let { x, y } = current.position;

    for (let j = 0; j < i; j++) {
      const other = siblings[j];
      const otherSize = getNodeSizeFromNode(other);

      if (nodesOverlap({ x, y }, currentSize, other.position, otherSize)) {
        x = other.position.x + otherSize.width + GRID_GAP_X;
        y = Math.max(y, other.position.y);
        changed = true;
      }
    }

    const fixedCheck = checkHorizontalOverlapWithFixedNodes(childFixedIds, siblings, i, nodeById, x, y, currentSize);
    x = fixedCheck.x;
    y = fixedCheck.y;
    if (fixedCheck.changed) changed = true;

    if (x !== current.position.x || y !== current.position.y) {
      nodeById.set(current.id, {
        ...current,
        position: { x, y },
      });
      siblings[i] = nodeById.get(current.id)!;
      changed = true;
    }
  }

  return changed;
}

function resizeFolderGroups(nodeById: Map<string, Node>, parentByNode: ReadonlyMap<string, string | null>): void {
  const folderGroupIds = [...nodeById.values()]
    .filter(node => node.type === 'folderGroup')
    .map(node => node.id)
    .sort((a, b) => getGroupDepth(b, parentByNode) - getGroupDepth(a, parentByNode));

  for (const groupId of folderGroupIds) {
    const size = resolveGroupSize(groupId, [...nodeById.values()], parentByNode);
    const groupNode = nodeById.get(groupId);
    if (groupNode) {
      nodeById.set(groupId, applyGroupSizeToNode(groupNode, size));
    }
  }
}

export interface ReflowInput {
  nodes: Node[];
  parentByNode: ReadonlyMap<string, string | null>;
  previousSizes: ReadonlyMap<string, NodeSize>;
  cache: PositionCache;
  currentFingerprints?: GroupFingerprints | null;
  previousFingerprints?: GroupFingerprints | null;
  previousNodes?: readonly Node[] | null;
}

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

  for (const groupId of sortedGroups) {
    reflowSiblingsInGroup(groupId, nodeById, parentByNode, fixedNodeIds);
    const updatedNodes = [...nodeById.values()];
    updateGroupCacheFromNodes(cache, updatedNodes, parentByNode, groupId);
  }

  resizeFolderGroups(nodeById, parentByNode);

  // Propagate size changes up: if a folderGroup resized, reflow its parent too.
  const parentGroupsToReflow = new Set<GroupId>();
  for (const groupId of sortedGroups) {
    if (groupId !== null) {
      parentGroupsToReflow.add(parentByNode.get(groupId) ?? null);
    }
  }

  const sortedParentGroups = [...parentGroupsToReflow].sort(
    (a, b) => getGroupDepth(b, parentByNode) - getGroupDepth(a, parentByNode),
  );

  for (const groupId of sortedParentGroups) {
    if (groupId === null && sortedGroups.includes(null)) continue;
    reflowSiblingsInGroup(groupId, nodeById, parentByNode, fixedNodeIds);
    const updatedNodes = [...nodeById.values()];
    updateGroupCacheFromNodes(cache, updatedNodes, parentByNode, groupId);
  }

  resizeFolderGroups(nodeById, parentByNode);

  // Ensure node order: parents before children.
  const depthById = new Map<string, number>();
  function getDepth(id: string): number {
    const cached = depthById.get(id);
    if (cached !== undefined) return cached;
    const node = nodeById.get(id);
    if (!node?.parentId) {
      depthById.set(id, 0);
      return 0;
    }
    const depth = getDepth(node.parentId) + 1;
    depthById.set(id, depth);
    return depth;
  }

  for (const id of nodeIds) {
    getDepth(id);
  }

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
  for (const groupId of getAncestorFolderGroupIds(nodeId, nodeById, parentByNode)) {
    const size = resolveGroupSize(groupId, [...nodeById.values()], parentByNode);
    const groupNode = nodeById.get(groupId);
    if (groupNode) {
      nodeById.set(groupId, applyGroupSizeToNode(groupNode, size));
    }
  }
}

function hasSizeGrown(
  nodeId: string,
  nodeById: Map<string, Node>,
  previousSizes: ReadonlyMap<string, NodeSize>,
): boolean {
  const node = nodeById.get(nodeId);
  const previousSize = previousSizes.get(nodeId);
  if (!node || !previousSize) return false;

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
  if (childIds.length === 0) return false;

  let minX = Infinity;
  let minY = Infinity;

  for (const childId of childIds) {
    const child = nodeById.get(childId);
    if (!child) continue;
    minX = Math.min(minX, child.position.x);
    minY = Math.min(minY, child.position.y);
  }

  const shiftX = GROUP_PADDING - minX;
  const shiftY = GROUP_HEADER + GROUP_PADDING - minY;
  if (shiftX === 0 && shiftY === 0) return false;

  for (const childId of childIds) {
    const child = nodeById.get(childId);
    if (!child) continue;
    nodeById.set(childId, {
      ...child,
      position: {
        x: child.position.x + shiftX,
        y: child.position.y + shiftY,
      },
    });
  }

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
    if (current === null) break;
    current = parentByNode.get(current) ?? null;
  }

  const draggedNode = nodeById.get(draggedNodeId);
  if (draggedNode?.type === 'folderGroup') {
    groups.add(draggedNodeId);
  }

  return [...groups].sort((a, b) => getGroupDepth(b, parentByNode) - getGroupDepth(a, parentByNode));
}

export function compactAfterDrag(
  nodes: Node[],
  parentByNode: ReadonlyMap<string, string | null>,
  draggedNodeId: string,
): Node[] {
  const nodeById = new Map(nodes.map(node => [node.id, { ...node }]));

  for (const groupId of collectGroupsToCompact(draggedNodeId, nodeById, parentByNode)) {
    compactGroupChildren(groupId, nodeById, parentByNode);
  }

  resizeFolderGroups(nodeById, parentByNode);

  return sortNodesByDepth([...nodeById.values()]);
}

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

  for (const ancestorId of getAncestorFolderGroupIds(draggedNodeId, nodeById, parentByNode)) {
    if (!hasSizeGrown(ancestorId, nodeById, previousSizes)) continue;

    const parentGroupId = parentByNode.get(ancestorId) ?? null;
    reflowSiblingsInGroup(parentGroupId, nodeById, parentByNode, new Set([ancestorId]));
    resizeFolderGroups(nodeById, parentByNode);
  }

  return sortNodesByDepth([...nodeById.values()]);
}

export function collectNodeSizes(nodes: readonly Node[]): Map<string, NodeSize> {
  return new Map(nodes.map(node => [node.id, getNodeSizeFromNode(node)]));
}
