import { BUILT_IN_PREFIX, BUILT_IN_ROOT } from '../isBuiltInPath';

/** Last path segment after the final `/` (full leaf name under `:buildIn:/`). */
export function getBaseName(path: string): string {
  if (path === BUILT_IN_ROOT) {
    return BUILT_IN_ROOT;
  }
  if (path.startsWith(BUILT_IN_PREFIX)) {
    return path.slice(BUILT_IN_PREFIX.length);
  }

  const lastSlash = path.lastIndexOf('/');
  return lastSlash === -1 ? path : path.slice(lastSlash + 1);
}
