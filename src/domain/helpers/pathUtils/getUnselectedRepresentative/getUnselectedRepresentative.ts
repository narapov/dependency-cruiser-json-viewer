import { getParentPath } from '../getParentPath';

/**
 * Collapse a path to its outermost unselected folder ancestor present in `folderSet`.
 * @example
 * getUnselectedRepresentative('src/vendor/a.ts', new Set(['src']), new Set(['src', 'src/vendor']))
 * // → 'src/vendor'
 */
export function getUnselectedRepresentative(path: string, selectedSet: Set<string>, folderSet: Set<string>): string {
  let current = path;
  let parent = getParentPath(current);
  while (parent && folderSet.has(parent) && !selectedSet.has(parent)) {
    current = parent;
    parent = getParentPath(current);
  }
  return current;
}
