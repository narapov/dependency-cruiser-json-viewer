import { getParentPath } from '../getParentPath';

/** Collapse a path to its nearest selected collapsed-folder ancestor. */
export function getRepresentative(path: string, selectedSet: Set<string>, expandedFolders: Set<string>): string {
  let current = path;
  let parent = getParentPath(current);
  while (parent && selectedSet.has(parent) && !expandedFolders.has(parent)) {
    current = parent;
    parent = getParentPath(current);
  }
  return current;
}
