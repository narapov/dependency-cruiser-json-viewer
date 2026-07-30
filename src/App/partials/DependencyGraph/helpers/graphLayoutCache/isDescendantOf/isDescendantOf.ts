export function isDescendantOf(
  nodeId: string,
  ancestorId: string,
  parentByNode: ReadonlyMap<string, string | null>,
): boolean {
  let current: string | null = parentByNode.get(nodeId) ?? null;
  while (current !== null) {
    if (current === ancestorId) return true;
    current = parentByNode.get(current) ?? null;
  }
  return false;
}
