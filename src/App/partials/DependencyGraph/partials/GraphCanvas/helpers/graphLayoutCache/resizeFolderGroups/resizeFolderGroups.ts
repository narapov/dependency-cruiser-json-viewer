import type { Node } from '@xyflow/react';

import { getGroupDepth } from '../getGroupDepth';
import { applyGroupSizeToNode, getNodeSize, resolveGroupSize } from '../resolveGroupSize';
import type { NodeSize } from '../types';

/** Resizes every folderGroup from deepest to shallowest based on current children. */
export function resizeFolderGroups(
  nodeById: Map<string, Node>,
  parentByNode: ReadonlyMap<string, string | null>,
): void {
  const folderGroupIds = [...nodeById.values()]
    .filter(node => node.type === 'folderGroup')
    .map(node => node.id)
    .sort((a, b) => getGroupDepth(b, parentByNode) - getGroupDepth(a, parentByNode));

  folderGroupIds.forEach(groupId => {
    const size = resolveGroupSize(groupId, [...nodeById.values()], parentByNode);
    const groupNode = nodeById.get(groupId);
    if (groupNode) {
      nodeById.set(groupId, applyGroupSizeToNode(groupNode, size));
    }
  });
}

/** Ancestor folderGroup ids for a node, deepest first. */
export function getAncestorFolderGroupIds(
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

/** Resizes folder groups that contain the given node. */
export function resizeAncestorGroups(
  nodeById: Map<string, Node>,
  parentByNode: ReadonlyMap<string, string | null>,
  nodeId: string,
): void {
  getAncestorFolderGroupIds(nodeId, nodeById, parentByNode).forEach(groupId => {
    const size = resolveGroupSize(groupId, [...nodeById.values()], parentByNode);
    const groupNode = nodeById.get(groupId);
    if (groupNode) {
      nodeById.set(groupId, applyGroupSizeToNode(groupNode, size));
    }
  });
}

/** True when the node's current size exceeds its previous snapshot. */
export function hasSizeGrown(
  nodeId: string,
  nodeById: Map<string, Node>,
  previousSizes: ReadonlyMap<string, NodeSize>,
): boolean {
  const node = nodeById.get(nodeId);
  const previousSize = previousSizes.get(nodeId);
  if (!node || !previousSize) {
    return false;
  }

  const currentSize = getNodeSize(node);
  return currentSize.width > previousSize.width || currentSize.height > previousSize.height;
}
