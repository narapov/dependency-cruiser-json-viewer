import type { Node } from '@xyflow/react';

import { updateGroupCacheFromNodes } from '../applyPositionCache';
import type { GroupId, PositionCache } from '../types';

/** Absolute canvas position for a node from stored relative positions. */
export function getAbsoluteNodePosition(
  nodeId: string,
  nodeById: ReadonlyMap<string, Node>,
  parentByNode: ReadonlyMap<string, string | null>,
): { x: number; y: number } {
  const node = nodeById.get(nodeId);
  if (!node) {
    return { x: 0, y: 0 };
  }

  const parentId = parentByNode.get(nodeId) ?? null;
  if (parentId === null) {
    return { ...node.position };
  }

  const parentAbs = getAbsoluteNodePosition(parentId, nodeById, parentByNode);
  return {
    x: parentAbs.x + node.position.x,
    y: parentAbs.y + node.position.y,
  };
}

/** Converts root-level dragged positions into relative coords when an ancestor folder expands. */
export function migrateReparentedNodePositions(
  nodes: Node[],
  parentByNode: ReadonlyMap<string, string | null>,
  previousParentByNode: ReadonlyMap<string, string | null> | null,
  previousNodes: readonly Node[] | null,
  cache: PositionCache,
): Node[] {
  if (!previousNodes || !previousParentByNode) {
    return nodes;
  }

  const previousById = new Map(previousNodes.map(node => [node.id, node]));
  const reparentedIds = nodes.flatMap(node => {
    const previousParent = previousParentByNode.get(node.id) ?? null;
    const currentParent = parentByNode.get(node.id) ?? null;
    return previousParent === null && currentParent !== null ? [node.id] : [];
  });

  if (reparentedIds.length === 0) {
    return nodes;
  }

  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const reparentedIdSet = new Set(reparentedIds);

  const migratedNodes = nodes.map(node => {
    if (!reparentedIdSet.has(node.id)) {
      return node;
    }

    const previous = previousById.get(node.id);
    const parentId = parentByNode.get(node.id);
    if (!previous || parentId == null) {
      return node;
    }

    const parentAbs = getAbsoluteNodePosition(parentId, nodeById, parentByNode);
    const childAbs = getAbsoluteNodePosition(node.id, previousById, previousParentByNode);

    const migrated = {
      ...node,
      position: {
        x: childAbs.x - parentAbs.x,
        y: childAbs.y - parentAbs.y,
      },
    };
    nodeById.set(node.id, migrated);
    return migrated;
  });

  const affectedGroups = reparentedIds.reduce((groups, nodeId) => {
    const groupId = parentByNode.get(nodeId) ?? null;
    groups.add(groupId);
    return groups;
  }, new Set<GroupId>());

  affectedGroups.forEach(groupId => {
    updateGroupCacheFromNodes(cache, migratedNodes, parentByNode, groupId);
  });

  return migratedNodes;
}
