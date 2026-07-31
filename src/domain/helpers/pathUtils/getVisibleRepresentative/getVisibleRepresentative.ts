import { getParentPath } from '../getParentPath';
import { getRepresentative } from '../getRepresentative';

/** Representative path walked up until it appears in the visible node set. */
export function getVisibleRepresentative(
  path: string,
  selectedSet: Set<string>,
  expandedFolders: Set<string>,
  visibleNodeIds: ReadonlySet<string>,
): string {
  let current = getRepresentative(path, selectedSet, expandedFolders);

  while (!visibleNodeIds.has(current)) {
    const parent = getParentPath(current);
    if (!parent) {
      return current;
    }

    current = parent;
  }

  return current;
}
