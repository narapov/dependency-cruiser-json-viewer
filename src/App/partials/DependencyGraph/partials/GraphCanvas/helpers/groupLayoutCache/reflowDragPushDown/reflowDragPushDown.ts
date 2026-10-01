import type { Node } from '@xyflow/react';

import { getDirectChildren } from '../../buildGraph/getDirectChildren';
import { GROUP_HEADER, GROUP_PADDING } from '../../buildGraph/layoutConstants';
import { applyGroupSizeToNode, getGroupDepth, getNodeSize, resolveGroupSize } from '../../graphLayoutCache';
import { buildGroupLayoutEntry } from '../mergeVisibleGroupLayouts';
import { settleOverlapsTopDown } from '../settleOverlapsTopDown';
import type { GroupId, LayoutCache } from '../types';

/**
 * Pushes overlapping non-dragged siblings down relative to the dragged node,
 * grows ancestor folder groups, and bubbles sibling push-down up the tree.
 */
export function reflowDragPushDown(
  nodes: Node[],
  parentByNode: ReadonlyMap<string, string | null>,
  draggedNodeId: string,
  draggedPosition: { x: number; y: number },
): Node[] {
  const nodeById = new Map(nodes.map(node => [node.id, { ...node }]));
  const dragged = nodeById.get(draggedNodeId);
  if (!dragged) {
    return nodes;
  }

  nodeById.set(draggedNodeId, { ...dragged, position: { ...draggedPosition } });

  let currentId = draggedNodeId;
  while (true) {
    const groupId = parentByNode.get(currentId) ?? null;
    pushOverlappingSiblingsDown(groupId, nodeById, parentByNode, currentId);
    resizeAncestorGroupsDeepestFirst(nodeById, parentByNode, currentId);

    if (groupId === null) {
      break;
    }

    const groupNode = nodeById.get(groupId);
    if (!groupNode || groupNode.type !== 'folderGroup') {
      break;
    }

    currentId = groupId;
  }

  return [...nodeById.values()];
}

function pushOverlappingSiblingsDown(
  groupId: GroupId,
  nodeById: Map<string, Node>,
  parentByNode: ReadonlyMap<string, string | null>,
  fixedNodeId: string,
): void {
  const nodeIds = new Set(nodeById.keys());
  const childIds = getDirectChildren(groupId, nodeIds, parentByNode);
  if (!nodeById.get(fixedNodeId) || childIds.length <= 1) {
    return;
  }

  const settleItems = childIds.map(id => {
    const node = nodeById.get(id)!;
    const size = getNodeSize(node);
    return {
      id,
      position: { ...node.position },
      width: size.width,
      height: size.height,
    };
  });

  settleOverlapsTopDown(settleItems, new Set([fixedNodeId]));

  settleItems.forEach(item => {
    const node = nodeById.get(item.id)!;
    nodeById.set(item.id, { ...node, position: item.position });
  });
}
function resizeAncestorGroupsDeepestFirst(
  nodeById: Map<string, Node>,
  parentByNode: ReadonlyMap<string, string | null>,
  nodeId: string,
): void {
  const ancestors: string[] = [];
  let current: string | null = parentByNode.get(nodeId) ?? null;
  while (current !== null) {
    const groupNode = nodeById.get(current);
    if (groupNode?.type === 'folderGroup') {
      ancestors.push(current);
    }
    current = parentByNode.get(current) ?? null;
  }

  ancestors
    .sort((a, b) => getGroupDepth(b, parentByNode) - getGroupDepth(a, parentByNode))
    .forEach(groupId => {
      const size = resolveGroupSize(groupId, [...nodeById.values()], parentByNode);
      const groupNode = nodeById.get(groupId);
      if (groupNode) {
        nodeById.set(groupId, applyGroupSizeToNode(groupNode, size));
      }
    });
}

/** Writes group layout entries for a node and all of its ancestor groups from RF nodes. */
export function updateCacheFromReactFlowNodes(
  cache: LayoutCache,
  nodes: readonly Node[],
  parentByNode: ReadonlyMap<string, string | null>,
  startNodeId: string,
): void {
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const nodeIds = new Set(nodeById.keys());

  let groupId: GroupId = parentByNode.get(startNodeId) ?? null;
  while (true) {
    const childIds = getDirectChildren(groupId, nodeIds, parentByNode);
    const children = childIds
      .map(id => nodeById.get(id))
      .filter((node): node is Node => node != null)
      .map(node => ({
        path: node.id,
        position: { ...node.position },
        width: getNodeSize(node).width,
        height: getNodeSize(node).height,
      }));

    const groupNode = groupId != null ? nodeById.get(groupId) : undefined;
    const groupSize =
      groupNode != null
        ? getNodeSize(groupNode)
        : {
            width: Math.max(...children.map(c => c.position.x + c.width), GROUP_PADDING) + GROUP_PADDING,
            height:
              Math.max(...children.map(c => c.position.y + c.height), GROUP_HEADER + GROUP_PADDING) + GROUP_PADDING,
          };

    cache.set(groupId, buildGroupLayoutEntry(groupId, children, groupSize));

    if (groupId === null) {
      break;
    }
    groupId = parentByNode.get(groupId) ?? null;
  }
}
