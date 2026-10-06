import { BUILT_IN_PREFIX, BUILT_IN_ROOT } from '../isBuiltInPath';

/** Parent directory path, or null when there is no `/` (flat under `:buildIn:`). */
export function getParentPath(path: string): string | null {
  if (path === BUILT_IN_ROOT) {
    return null;
  }
  if (path.startsWith(BUILT_IN_PREFIX)) {
    return BUILT_IN_ROOT;
  }

  const lastSlash = path.lastIndexOf('/');
  if (lastSlash === -1) {
    return null;
  }
  return path.slice(0, lastSlash);
}
