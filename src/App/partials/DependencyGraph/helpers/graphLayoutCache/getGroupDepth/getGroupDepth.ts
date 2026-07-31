import type { GroupId } from '../types';

/** Counts ancestors from a group id up to the root (null → 0). */
export function getGroupDepth(groupId: GroupId, parentByNode: ReadonlyMap<string, string | null>): number {
  if (groupId === null) {
    return 0;
  }

  let depth = 0;
  let current: string | null = groupId;
  while (current !== null) {
    depth++;
    current = parentByNode.get(current) ?? null;
  }
  return depth;
}
