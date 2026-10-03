import type { VisibleTreeLayoutedNode } from '../../../types';
import { getDirectChildren, GROUP_HEADER, GROUP_PADDING } from '../../buildGraph';
import type { GroupId } from '../../layoutCache/types';
import { isExpandedFolderGroup } from '../resolveGroupSize';

const CONTENT_ORIGIN_X = GROUP_PADDING;
const CONTENT_ORIGIN_Y = GROUP_HEADER + GROUP_PADDING;

/**
 * Compacts a folder group's children to the build content origin (signed shift
 * for left/up grow and leftmost/topmost inset shrink) and moves the group by
 * the opposite delta so world positions stay unchanged.
 */
export function normalizeGroupContentOrigin(
  groupId: GroupId,
  nodesByPath: Map<string, VisibleTreeLayoutedNode>,
  childrenByParent: ReadonlyMap<GroupId, readonly string[]>,
): boolean {
  if (groupId === null) {
    return false;
  }

  const groupNode = nodesByPath.get(groupId);
  if (!isExpandedFolderGroup(groupNode)) {
    return false;
  }

  const childIds = getDirectChildren(groupId, childrenByParent);
  if (childIds.length === 0) {
    return false;
  }

  const { minX, minY } = childIds
    .map(childId => nodesByPath.get(childId))
    .filter((node): node is VisibleTreeLayoutedNode => node != null)
    .reduce(
      (bounds, node) => ({
        minX: Math.min(bounds.minX, node.position.x),
        minY: Math.min(bounds.minY, node.position.y),
      }),
      { minX: Infinity, minY: Infinity },
    );

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return false;
  }

  const shiftX = CONTENT_ORIGIN_X - minX;
  const shiftY = CONTENT_ORIGIN_Y - minY;
  if (shiftX === 0 && shiftY === 0) {
    return false;
  }

  childIds.forEach(childId => {
    const child = nodesByPath.get(childId);
    if (!child) {
      return;
    }
    nodesByPath.set(childId, {
      ...child,
      position: {
        x: child.position.x + shiftX,
        y: child.position.y + shiftY,
      },
    });
  });

  nodesByPath.set(groupId, {
    ...groupNode,
    position: {
      x: groupNode.position.x - shiftX,
      y: groupNode.position.y - shiftY,
    },
  });

  return true;
}
