/** Sorted ids of nodes whose parent is the given folder (or root when null). */
export function getDirectChildren(
  folderId: string | null,
  visibleNodeIds: ReadonlySet<string>,
  parentByNode: ReadonlyMap<string, string | null>,
): string[] {
  const children: string[] = [];
  for (const id of visibleNodeIds) {
    const parent = parentByNode.get(id) ?? null;
    if (parent === folderId) {
      children.push(id);
    }
  }
  return children.sort();
}
