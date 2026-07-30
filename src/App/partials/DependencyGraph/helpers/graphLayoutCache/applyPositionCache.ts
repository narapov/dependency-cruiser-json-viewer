import type { Node } from '@xyflow/react';

import { getDirectChildren } from '../buildGraph';
import { isDescendantOf } from './isDescendantOf';
import type { GroupFingerprints, GroupId, PositionCache } from './types';

export function applyAutoLayoutGroupLevel(
  nodes: Node[],
  layoutNodes: Node[],
  groupId: string,
  parentByNode: ReadonlyMap<string, string | null>,
): Node[] {
  const layoutById = new Map(layoutNodes.map(node => [node.id, node]));
  const nodeIds = new Set(nodes.map(node => node.id));
  const levelNodeIds = new Set(getDirectChildren(groupId, nodeIds, parentByNode));
  levelNodeIds.add(groupId);

  return nodes.map(node => {
    if (!levelNodeIds.has(node.id)) return node;

    const layoutNode = layoutById.get(node.id);
    if (!layoutNode) return node;

    return {
      ...node,
      position: { ...layoutNode.position },
      width: layoutNode.width,
      height: layoutNode.height,
      style: layoutNode.style ? { ...node.style, ...layoutNode.style } : node.style,
    };
  });
}

export function applyAutoLayoutSubtree(
  nodes: Node[],
  layoutNodes: Node[],
  groupId: string,
  parentByNode: ReadonlyMap<string, string | null>,
): Node[] {
  const layoutById = new Map(layoutNodes.map(node => [node.id, node]));

  return nodes.map(node => {
    if (node.id !== groupId && !isDescendantOf(node.id, groupId, parentByNode)) {
      return node;
    }

    const layoutNode = layoutById.get(node.id);
    if (!layoutNode) return node;

    return {
      ...node,
      position: { ...layoutNode.position },
      width: layoutNode.width,
      height: layoutNode.height,
      style: layoutNode.style ? { ...node.style, ...layoutNode.style } : node.style,
    };
  });
}

export function updateGroupPositionCache(
  cache: PositionCache,
  nodes: Node[],
  parentByNode: ReadonlyMap<string, string | null>,
  groupId: string,
): void {
  updateGroupCacheFromNodes(cache, nodes, parentByNode, groupId);
  updateGroupCacheFromNodes(cache, nodes, parentByNode, parentByNode.get(groupId) ?? null);
}

export function updateSubtreeGroupCaches(
  cache: PositionCache,
  nodes: Node[],
  parentByNode: ReadonlyMap<string, string | null>,
  groupId: string,
): void {
  for (const node of nodes) {
    if (node.type !== 'folderGroup') continue;
    if (node.id === groupId || isDescendantOf(node.id, groupId, parentByNode)) {
      updateGroupCacheFromNodes(cache, nodes, parentByNode, node.id);
    }
  }

  updateGroupCacheFromNodes(cache, nodes, parentByNode, parentByNode.get(groupId) ?? null);
}

export function preserveExpandedGroupPositions(nodes: Node[], previousNodes: readonly Node[] | null): Node[] {
  if (!previousNodes) return nodes;

  const previousById = new Map(previousNodes.map(node => [node.id, node]));

  return nodes.map(node => {
    const previous = previousById.get(node.id);
    if (node.type === 'folderGroup' && previous?.type === 'folder') {
      return { ...node, position: { ...previous.position } };
    }
    return node;
  });
}

export function applyPositionCache(
  nodes: Node[],
  parentByNode: ReadonlyMap<string, string | null>,
  cache: PositionCache,
  currentFingerprints: GroupFingerprints,
  previousFingerprints: GroupFingerprints | null,
): Node[] {
  const nodeById = new Map(nodes.map(node => [node.id, { ...node }]));
  const nodeIds = new Set(nodes.map(node => node.id));

  for (const [groupId, fingerprint] of currentFingerprints) {
    const groupCache = cache.get(groupId);
    if (!groupCache) continue;

    const previous = previousFingerprints?.get(groupId);
    if (previous !== undefined && previous !== fingerprint) continue;

    const childIds = getDirectChildren(groupId, nodeIds, parentByNode);
    const allCached = childIds.every(childId => groupCache.has(childId));
    if (!allCached) continue;

    for (const childId of childIds) {
      const cachedPosition = groupCache.get(childId);
      const node = nodeById.get(childId);
      if (cachedPosition && node) {
        node.position = { ...cachedPosition };
      }
    }
  }

  return [...nodeById.values()];
}

export function updateGroupCacheFromNodes(
  cache: PositionCache,
  nodes: Node[],
  parentByNode: ReadonlyMap<string, string | null>,
  groupId: GroupId,
): void {
  const nodeIds = new Set(nodes.map(node => node.id));
  const childIds = getDirectChildren(groupId, nodeIds, parentByNode);
  const nodeById = new Map(nodes.map(node => [node.id, node]));

  let groupCache = cache.get(groupId);
  if (!groupCache) {
    groupCache = new Map();
    cache.set(groupId, groupCache);
  }

  for (const childId of childIds) {
    const node = nodeById.get(childId);
    if (node) {
      groupCache.set(childId, { ...node.position });
    }
  }
}
