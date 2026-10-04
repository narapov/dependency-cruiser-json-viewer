/** Convert a path list into a sparse absence record (`false` when collapsed). */
export function pathsToAbsenceRecord(paths: readonly string[]): Record<string, boolean | undefined> {
  return Object.fromEntries(paths.map(path => [path, false as const]));
}
