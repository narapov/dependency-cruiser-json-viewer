import { getParentPath } from '../getParentPath';

/** Ancestor folder paths from nearest parent up to the root. */
export function getAncestorKeys(key: string): string[] {
  const ancestors: string[] = [];
  let current = getParentPath(key);
  while (current) {
    ancestors.push(current);
    current = getParentPath(current);
  }
  return ancestors;
}
