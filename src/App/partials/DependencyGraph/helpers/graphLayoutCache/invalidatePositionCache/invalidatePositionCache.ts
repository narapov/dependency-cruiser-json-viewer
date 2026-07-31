import { getParentPath } from '@/domain';

import { isDescendantOf } from '../isDescendantOf';
import type { GroupFingerprints, GroupId, PositionCache } from '../types';

/** Drops a group's cache and its entry in the parent group's child map. */
export function invalidateGroupPositionCache(
  cache: PositionCache,
  groupId: string,
  parentByNode: ReadonlyMap<string, string | null>,
): void {
  cache.delete(groupId);

  const parentId = parentByNode.get(groupId) ?? null;
  const parentCache = cache.get(parentId);
  if (parentCache) {
    parentCache.delete(groupId);
    if (parentCache.size === 0) {
      cache.delete(parentId);
    }
  }
}

/** Clears cache for a group and every folder-group descendant. */
export function invalidateGroupPositionCacheRecursive(
  cache: PositionCache,
  groupId: string,
  nodes: readonly { id: string; type?: string }[],
  parentByNode: ReadonlyMap<string, string | null>,
): void {
  nodes
    .filter(
      node => node.type === 'folderGroup' && (node.id === groupId || isDescendantOf(node.id, groupId, parentByNode)),
    )
    .forEach(node => {
      cache.delete(node.id);
    });

  invalidateGroupPositionCache(cache, groupId, parentByNode);
}

function groupCacheKey(groupId: GroupId): string {
  return groupId ?? '__root__';
}

function hasVisibleAncestor(groupId: string, visibleNodeIds: ReadonlySet<string>): boolean {
  let current = getParentPath(groupId);
  while (current !== null) {
    if (visibleNodeIds.has(current)) {
      return true;
    }
    current = getParentPath(current);
  }
  return false;
}

/** Removes stale or fingerprint-changed group entries from the position cache. */
export function invalidatePositionCache(
  cache: PositionCache,
  currentFingerprints: GroupFingerprints,
  previousFingerprints: GroupFingerprints | null,
  visibleNodeIds: ReadonlySet<string>,
): void {
  const validGroupKeys = new Set([...currentFingerprints.keys()].map(groupCacheKey));

  [...cache.keys()]
    .filter(key => {
      if (validGroupKeys.has(groupCacheKey(key))) {
        return false;
      }
      return !(key !== null && (visibleNodeIds.has(key) || hasVisibleAncestor(key, visibleNodeIds)));
    })
    .forEach(key => {
      cache.delete(key);
    });

  if (previousFingerprints == null) {
    return;
  }

  [...currentFingerprints.entries()]
    .filter(([groupId, fingerprint]) => {
      const previous = previousFingerprints.get(groupId);
      return previous !== undefined && previous !== fingerprint;
    })
    .forEach(([groupId]) => {
      cache.delete(groupId);
    });
}
