import type { Node } from '@xyflow/react';

import { getDirectChildren, GROUP_HEADER, GROUP_PADDING } from '../buildGraph';
import { LEAF_NODE_HEIGHT, LEAF_NODE_MIN_WIDTH } from '../getLeafNodeSize';
import type { GroupId, NodeSize } from './types';

const NODE_HEIGHT = LEAF_NODE_HEIGHT;

function getNodeSize(node: Node): NodeSize {
  const width = node.width ?? (typeof node.style?.width === 'number' ? node.style.width : LEAF_NODE_MIN_WIDTH);
  const height = node.height ?? (typeof node.style?.height === 'number' ? node.style.height : NODE_HEIGHT);
  return { width, height };
}

export function resolveGroupSize(
  groupId: GroupId,
  nodes: Node[],
  parentByNode: ReadonlyMap<string, string | null>,
): NodeSize {
  const nodeIds = new Set(nodes.map(node => node.id));
  const childIds = getDirectChildren(groupId, nodeIds, parentByNode);
  const nodeById = new Map(nodes.map(node => [node.id, node]));

  if (childIds.length === 0) {
    return {
      width: LEAF_NODE_MIN_WIDTH + GROUP_PADDING * 2,
      height: GROUP_HEADER + NODE_HEIGHT + GROUP_PADDING * 2,
    };
  }

  let maxX = 0;
  let maxY = 0;

  for (const childId of childIds) {
    const node = nodeById.get(childId);
    if (!node) continue;
    const size = getNodeSize(node);
    maxX = Math.max(maxX, node.position.x + size.width);
    maxY = Math.max(maxY, node.position.y + size.height);
  }

  return {
    width: Math.max(maxX + GROUP_PADDING, LEAF_NODE_MIN_WIDTH + GROUP_PADDING * 2),
    height: Math.max(maxY + GROUP_PADDING, GROUP_HEADER + NODE_HEIGHT + GROUP_PADDING),
  };
}

export function applyGroupSizeToNode(node: Node, size: NodeSize): Node {
  return {
    ...node,
    width: size.width,
    height: size.height,
    style: {
      ...node.style,
      width: size.width,
      height: size.height,
    },
  };
}

export function getNodeSizeFromNode(node: Node): NodeSize {
  return getNodeSize(node);
}
