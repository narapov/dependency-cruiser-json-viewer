/** Whether the path itself or any of its descendant files is present in the selection record. */
export function isPathVisibleInSelectionRecord(
  path: string,
  selectedFilePaths: Record<string, boolean | undefined>,
  descendantFiles: ReadonlySet<string> | readonly string[],
): boolean {
  if (selectedFilePaths[path]) {
    return true;
  }
  return [...descendantFiles].some(file => !!selectedFilePaths[file]);
}
