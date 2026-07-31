import type { Node } from '@xyflow/react';

import { getDirectChildren } from '../../buildGraph';
import { isDescendantOf } from '../isDescendantOf';
import type { GroupFingerprints, GroupId, PositionCache } from '../types';

/** Overwrites positions and sizes for a group and its direct children from a layout pass. */
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
    if (!levelNodeIds.has(node.id)) {
      return node;
    }

    const layoutNode = layoutById.get(node.id);
    if (!layoutNode) {
      return node;
    }

    return {
      ...node,
      position: { ...layoutNode.position },
      width: layoutNode.width,
      height: layoutNode.height,
      style: layoutNode.style ? { ...node.style, ...layoutNode.style } : node.style,
    };
  });
}

/** Overwrites positions and sizes for a group and all of its descendants from a layout pass. */
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
    if (!layoutNode) {
      return node;
    }

    return {
      ...node,
      position: { ...layoutNode.position },
      width: layoutNode.width,
      height: layoutNode.height,
      style: layoutNode.style ? { ...node.style, ...layoutNode.style } : node.style,
    };
  });
}

/** Stores child positions for a group and its parent after a layout change. */
export function updateGroupPositionCache(
  cache: PositionCache,
  nodes: Node[],
  parentByNode: ReadonlyMap<string, string | null>,
  groupId: string,
): void {
  updateGroupCacheFromNodes(cache, nodes, parentByNode, groupId);
  updateGroupCacheFromNodes(cache, nodes, parentByNode, parentByNode.get(groupId) ?? null);
}

/** Refreshes position caches for every folder group under (and including) a group. */
export function updateSubtreeGroupCaches(
  cache: PositionCache,
  nodes: Node[],
  parentByNode: ReadonlyMap<string, string | null>,
  groupId: string,
): void {
  nodes
    .filter(
      node => node.type === 'folderGroup' && (node.id === groupId || isDescendantOf(node.id, groupId, parentByNode)),
    )
    .reduce((_, node) => {
      updateGroupCacheFromNodes(cache, nodes, parentByNode, node.id);
      return null;
    }, null);

  updateGroupCacheFromNodes(cache, nodes, parentByNode, parentByNode.get(groupId) ?? null);
}

/** Keeps a newly expanded folder group at the prior collapsed-folder position. */
export function preserveExpandedGroupPositions(nodes: Node[], previousNodes: readonly Node[] | null): Node[] {
  if (!previousNodes) {
    return nodes;
  }

  const previousById = new Map(previousNodes.map(node => [node.id, node]));

  return nodes.map(node => {
    const previous = previousById.get(node.id);
    if (node.type === 'folderGroup' && previous?.type === 'folder') {
      return { ...node, position: { ...previous.position } };
    }
    return node;
  });
}

/** Restores cached child positions for groups whose fingerprint is unchanged. */
export function applyPositionCache(
  nodes: Node[],
  parentByNode: ReadonlyMap<string, string | null>,
  cache: PositionCache,
  currentFingerprints: GroupFingerprints,
  previousFingerprints: GroupFingerprints | null,
): Node[] {
  const nodeIds = new Set(nodes.map(node => node.id));

  const restoredById = [...currentFingerprints.entries()]
    .filter(([groupId, fingerprint]) => {
      const groupCache = cache.get(groupId);
      if (!groupCache) {
        return false;
      }
      const previous = previousFingerprints?.get(groupId);
      if (previous !== undefined && previous !== fingerprint) {
        return false;
      }
      const childIds = getDirectChildren(groupId, nodeIds, parentByNode);
      return childIds.every(childId => groupCache.has(childId));
    })
    .flatMap(([groupId]) => {
      const groupCache = cache.get(groupId)!;
      return getDirectChildren(groupId, nodeIds, parentByNode)
        .map(childId => {
          const cachedPosition = groupCache.get(childId);
          return cachedPosition ? ([childId, cachedPosition] as const) : null;
        })
        .filter((entry): entry is readonly [string, { x: number; y: number }] => entry != null);
    })
    .reduce((map, [childId, position]) => {
      map.set(childId, position);
      return map;
    }, new Map<string, { x: number; y: number }>());

  return nodes.map(node => {
    const cachedPosition = restoredById.get(node.id);
    return cachedPosition ? { ...node, position: { ...cachedPosition } } : { ...node };
  });
}

/** Writes current direct-child positions into the cache entry for a group. */
export function updateGroupCacheFromNodes(
  cache: PositionCache,
  nodes: Node[],
  parentByNode: ReadonlyMap<string, string | null>,
  groupId: GroupId,
): void {
  const nodeIds = new Set(nodes.map(node => node.id));
  const childIds = getDirectChildren(groupId, nodeIds, parentByNode);
  const nodeById = new Map(nodes.map(node => [node.id, node]));

  const groupCache =
    cache.get(groupId) ??
    (() => {
      const created = new Map();
      cache.set(groupId, created);
      return created;
    })();

  childIds
    .map(childId => nodeById.get(childId))
    .filter((node): node is Node => node != null)
    .reduce((acc, node) => {
      acc.set(node.id, { ...node.position });
      return acc;
    }, groupCache);
}
