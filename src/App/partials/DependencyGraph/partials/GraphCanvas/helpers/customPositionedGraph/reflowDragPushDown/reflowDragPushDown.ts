import type { VisibleTreeLayoutedNode } from '../../../types';
import { getDirectChildren } from '../../buildGraph/getDirectChildren';
import { settleOverlapsTopDown } from '../../buildGraph/settleOverlapsTopDown';
import type { GroupId } from '../../layoutCache/types';
import { getGroupDepth } from '../getGroupDepth';
import { applyGroupSize, isExpandedFolderGroup, resolveGroupSize } from '../resolveGroupSize';

/**
 * Pushes overlapping non-dragged siblings down relative to the dragged node,
 * grows ancestor folder groups, and bubbles sibling push-down up the tree.
 */
export function reflowDragPushDown(
  nodesByPath: Map<string, VisibleTreeLayoutedNode>,
  parentByNode: ReadonlyMap<string, string | null>,
  draggedNodeId: string,
  draggedPosition: { x: number; y: number },
): Map<string, VisibleTreeLayoutedNode> {
  const nextByPath = new Map(
    [...nodesByPath.entries()].map(([path, node]) => [
      path,
      {
        ...node,
        position: { ...node.position },
      },
    ]),
  );
  const dragged = nextByPath.get(draggedNodeId);
  if (!dragged) {
    return nextByPath;
  }

  nextByPath.set(draggedNodeId, { ...dragged, position: { ...draggedPosition } });

  let currentId = draggedNodeId;
  for (;;) {
    const groupId = parentByNode.get(currentId) ?? null;
    pushOverlappingSiblingsDown(groupId, nextByPath, parentByNode, currentId);
    resizeAncestorGroupsDeepestFirst(nextByPath, parentByNode, currentId);

    if (groupId === null) {
      break;
    }

    const groupNode = nextByPath.get(groupId);
    if (!isExpandedFolderGroup(groupNode)) {
      break;
    }

    currentId = groupId;
  }

  return nextByPath;
}

function pushOverlappingSiblingsDown(
  groupId: GroupId,
  nodesByPath: Map<string, VisibleTreeLayoutedNode>,
  parentByNode: ReadonlyMap<string, string | null>,
  fixedNodeId: string,
): void {
  const nodeIds = new Set(nodesByPath.keys());
  const childIds = getDirectChildren(groupId, nodeIds, parentByNode);
  if (!nodesByPath.get(fixedNodeId) || childIds.length <= 1) {
    return;
  }

  const settleItems = childIds.map(id => {
    const node = nodesByPath.get(id)!;
    return {
      id,
      position: { ...node.position },
      width: node.width,
      height: node.height,
    };
  });

  settleOverlapsTopDown(settleItems, new Set([fixedNodeId]));

  settleItems.forEach(item => {
    const node = nodesByPath.get(item.id)!;
    nodesByPath.set(item.id, { ...node, position: item.position });
  });
}

function resizeAncestorGroupsDeepestFirst(
  nodesByPath: Map<string, VisibleTreeLayoutedNode>,
  parentByNode: ReadonlyMap<string, string | null>,
  nodeId: string,
): void {
  const ancestors: string[] = [];
  let current: string | null = parentByNode.get(nodeId) ?? null;
  while (current) {
    const groupNode = nodesByPath.get(current);
    if (isExpandedFolderGroup(groupNode)) {
      ancestors.push(current);
    }
    current = parentByNode.get(current) ?? null;
  }

  ancestors
    .sort((a, b) => getGroupDepth(b, parentByNode) - getGroupDepth(a, parentByNode))
    .forEach(groupId => {
      const size = resolveGroupSize(groupId, nodesByPath, parentByNode);
      const groupNode = nodesByPath.get(groupId);
      if (groupNode) {
        nodesByPath.set(groupId, applyGroupSize(groupNode, size));
      }
    });
}
