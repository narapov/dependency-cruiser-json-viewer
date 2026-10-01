import type { GroupId, GroupLayoutEntry, LayoutCache } from '../types';

/** True when the cached child ids exactly match the visible child ids (order-independent). */
export function groupMembershipMatches(
  entry: GroupLayoutEntry | undefined,
  visibleChildIds: ReadonlySet<string> | readonly string[],
): boolean {
  if (!entry) {
    return false;
  }

  const visible = visibleChildIds instanceof Set ? visibleChildIds : new Set(visibleChildIds);
  if (entry.children.size !== visible.size) {
    return false;
  }

  return [...entry.children.keys()].every(childId => visible.has(childId));
}

/** Removes a single group entry from the cache. */
export function invalidateGroupLayout(cache: LayoutCache, groupId: GroupId): void {
  cache.delete(groupId);
}

/**
 * Removes a group entry and every cached group whose id is the group or a path under it.
 * Root (`null`) clears the entire cache.
 */
export function invalidateGroupLayoutRecursive(cache: LayoutCache, groupId: GroupId): void {
  if (groupId === null) {
    cache.clear();
    return;
  }

  [...cache.keys()]
    .filter(id => id === groupId || (id && (id === groupId || id.startsWith(`${groupId}/`))))
    .forEach(id => {
      cache.delete(id);
    });
}
