import type { VisibleTreeLayoutedNode } from '../../../types';
import { getDirectChildren } from '../../buildGraph/getDirectChildren';
import { settleOverlapsTopDown } from '../../buildGraph/settleOverlapsTopDown';
import type { GroupId } from '../../layoutCache/types';
import { normalizeGroupContentOrigin } from '../normalizeGroupContentOrigin';
import { applyGroupSize, isExpandedFolderGroup, resolveGroupSize } from '../resolveGroupSize';

/**
 * Pushes overlapping non-dragged siblings down relative to the dragged node,
 * normalizes folder groups to the content origin, grows ancestors, and bubbles
 * sibling push-down up the tree.
 */
export function reflowDragPushDown(
  nodesByPath: Map<string, VisibleTreeLayoutedNode>,
  childrenByParent: ReadonlyMap<GroupId, readonly string[]>,
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
    const current = nextByPath.get(currentId);
    const groupId = current?.ancestors[0] ?? null;
    pushOverlappingSiblingsDown(groupId, nextByPath, childrenByParent, currentId);
    normalizeAndResizeAncestorGroupsDeepestFirst(nextByPath, childrenByParent, currentId);

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
  childrenByParent: ReadonlyMap<GroupId, readonly string[]>,
  fixedNodeId: string,
): void {
  const childIds = getDirectChildren(groupId, childrenByParent);
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

function normalizeAndResizeAncestorGroupsDeepestFirst(
  nodesByPath: Map<string, VisibleTreeLayoutedNode>,
  childrenByParent: ReadonlyMap<GroupId, readonly string[]>,
  nodeId: string,
): void {
  const node = nodesByPath.get(nodeId);
  if (!node) {
    return;
  }

  node.ancestors
    .filter(groupId => isExpandedFolderGroup(nodesByPath.get(groupId)))
    .forEach(groupId => {
      normalizeGroupContentOrigin(groupId, nodesByPath, childrenByParent);
      const size = resolveGroupSize(groupId, nodesByPath, childrenByParent);
      const groupNode = nodesByPath.get(groupId);
      if (groupNode) {
        nodesByPath.set(groupId, applyGroupSize(groupNode, size));
      }
    });
}
