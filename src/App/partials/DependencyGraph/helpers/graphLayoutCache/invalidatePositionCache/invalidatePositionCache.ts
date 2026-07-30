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
  for (const node of nodes) {
    if (node.type !== 'folderGroup') continue;
    if (node.id === groupId || isDescendantOf(node.id, groupId, parentByNode)) {
      cache.delete(node.id);
    }
  }

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

  for (const key of [...cache.keys()]) {
    if (!validGroupKeys.has(groupCacheKey(key))) {
      if (key !== null && (visibleNodeIds.has(key) || hasVisibleAncestor(key, visibleNodeIds))) {
        continue;
      }
      cache.delete(key);
    }
  }

  if (previousFingerprints == null) return;

  for (const [groupId, fingerprint] of currentFingerprints) {
    const previous = previousFingerprints.get(groupId);
    if (previous !== undefined && previous !== fingerprint) {
      cache.delete(groupId);
    }
  }
}
