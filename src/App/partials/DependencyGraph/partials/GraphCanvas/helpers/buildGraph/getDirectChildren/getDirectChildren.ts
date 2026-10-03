import type { GroupId } from '../../layoutCache/types';

/** Sorted ids of nodes whose parent is the given folder (or root when null). */
export function getDirectChildren(
  folderId: GroupId,
  childrenByParent: ReadonlyMap<GroupId, readonly string[]>,
): readonly string[] {
  return childrenByParent.get(folderId) ?? [];
}
