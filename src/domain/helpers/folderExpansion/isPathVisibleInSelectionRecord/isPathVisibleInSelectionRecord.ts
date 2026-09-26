/** Whether the path itself or any of its descendant files is present in the selection record. */
export function isPathVisibleInSelectionRecord(
  path: string,
  selectedFilePaths: Record<string, boolean | undefined>,
  descendantFiles: readonly string[],
): boolean {
  return !!selectedFilePaths[path] || descendantFiles.some(file => !!selectedFilePaths[file]);
}
