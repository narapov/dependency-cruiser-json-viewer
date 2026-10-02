import type { VisibleTreeLayoutedNode } from '../../../types';
import { getDirectChildren, GROUP_HEADER, GROUP_PADDING } from '../../buildGraph';
import { LEAF_NODE_HEIGHT, LEAF_NODE_MIN_WIDTH } from '../../getLeafNodeSize';
import type { GroupId } from '../../layoutCache/types';
import type { NodeSize } from '../types';

const NODE_HEIGHT = LEAF_NODE_HEIGHT;

function isFolderGroup(node: VisibleTreeLayoutedNode): boolean {
  return node.children != null;
}

/** Computes folder group size from the bounding box of its direct children. */
export function resolveGroupSize(
  groupId: GroupId,
  nodesByPath: ReadonlyMap<string, VisibleTreeLayoutedNode>,
  parentByNode: ReadonlyMap<string, string | null>,
): NodeSize {
  const nodeIds = new Set(nodesByPath.keys());
  const childIds = getDirectChildren(groupId, nodeIds, parentByNode);

  if (childIds.length === 0) {
    return {
      width: LEAF_NODE_MIN_WIDTH + GROUP_PADDING * 2,
      height: GROUP_HEADER + NODE_HEIGHT + GROUP_PADDING * 2,
    };
  }

  const { maxX, maxY } = childIds
    .map(childId => nodesByPath.get(childId))
    .filter((node): node is VisibleTreeLayoutedNode => node != null)
    .reduce(
      (bounds, node) => ({
        maxX: Math.max(bounds.maxX, node.position.x + node.width),
        maxY: Math.max(bounds.maxY, node.position.y + node.height),
      }),
      { maxX: 0, maxY: 0 },
    );

  return {
    width: Math.max(maxX + GROUP_PADDING, LEAF_NODE_MIN_WIDTH + GROUP_PADDING * 2),
    height: Math.max(maxY + GROUP_PADDING, GROUP_HEADER + NODE_HEIGHT + GROUP_PADDING),
  };
}

/** Returns a copy of the layouted node with updated width and height. */
export function applyGroupSize(node: VisibleTreeLayoutedNode, size: NodeSize): VisibleTreeLayoutedNode {
  return {
    ...node,
    width: size.width,
    height: size.height,
  };
}

/** Returns true when the node represents an expanded folder group container. */
export function isExpandedFolderGroup(node: VisibleTreeLayoutedNode | undefined): boolean {
  return node != null && isFolderGroup(node);
}
