/** Sorted ids of nodes whose parent is the given folder (or root when null). */
export function getDirectChildren(
  folderId: string | null,
  visibleNodeIds: ReadonlySet<string>,
  parentByNode: ReadonlyMap<string, string | null>,
): string[] {
  return [...visibleNodeIds].filter(id => (parentByNode.get(id) ?? null) === folderId).sort();
}
