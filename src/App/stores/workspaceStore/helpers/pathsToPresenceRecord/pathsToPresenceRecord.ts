/** Convert a path list into a sparse presence record (`true` when present). */
export function pathsToPresenceRecord(paths: readonly string[]): Record<string, boolean | undefined> {
  return Object.fromEntries(paths.map(path => [path, true as const]));
}
