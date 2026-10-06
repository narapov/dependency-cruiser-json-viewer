/** Synthetic cruise-snapshot root for core modules. */
export const BUILT_IN_ROOT = ':buildIn:';

/** Prefix for core-module snapshot paths (`:buildIn:/node:fs`). */
export const BUILT_IN_PREFIX = `${BUILT_IN_ROOT}/`;

/** Whether a path is the synthetic `:buildIn:` root or a leaf under it. */
export function isBuiltInPath(path: string): boolean {
  return path === BUILT_IN_ROOT || path.startsWith(BUILT_IN_PREFIX);
}
