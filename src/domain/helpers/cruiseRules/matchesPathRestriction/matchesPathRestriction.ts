/** Whether `value` matches any regex in `patterns` (string or array). */
function matchesAnyPattern(value: string, patterns: string | string[]): boolean {
  const list = Array.isArray(patterns) ? patterns : [patterns];
  return list.some(pattern => new RegExp(pattern).test(value));
}

/**
 * Match a module path against dependency-cruiser `path` / `pathNot` restrictions.
 * Missing `path` matches all; missing `pathNot` excludes none.
 */
export function matchesPathRestriction(
  modulePath: string,
  path?: string | string[],
  pathNot?: string | string[],
): boolean {
  const pathOk = !path || matchesAnyPattern(modulePath, path);
  const pathNotOk = !pathNot || !matchesAnyPattern(modulePath, pathNot);
  return pathOk && pathNotOk;
}
