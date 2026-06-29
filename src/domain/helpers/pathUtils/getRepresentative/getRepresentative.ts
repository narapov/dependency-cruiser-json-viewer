import { getParentPath } from '../getParentPath';

export function getRepresentative(path: string, selectedSet: Set<string>, expandedFolders: Set<string>): string {
  let current = path;
  while (true) {
    const parent = getParentPath(current);
    if (!parent || !selectedSet.has(parent) || expandedFolders.has(parent)) break;
    current = parent;
  }
  return current;
}
