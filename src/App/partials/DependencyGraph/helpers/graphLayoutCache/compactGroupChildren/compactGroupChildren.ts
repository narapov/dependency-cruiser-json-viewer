import type { Node } from '@xyflow/react';

import { getDirectChildren, GROUP_HEADER, GROUP_PADDING } from '../../buildGraph';
import { getGroupDepth } from '../getGroupDepth';
import type { GroupId } from '../types';

/** Shifts children so the group content hugs GROUP_PADDING / GROUP_HEADER again. */
export function compactGroupChildren(
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

/** Groups along the dragged node ancestry (and the node itself if a folderGroup), deepest first. */
export function collectGroupsToCompact(
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
