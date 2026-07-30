/** Whether a path is selected or has a selected descendant. */
export function isPathVisibleInSelection(path: string, selectedPaths: string[]): boolean {
  if (selectedPaths.includes(path)) return true;
  return selectedPaths.some(selected => selected.startsWith(`${path}/`));
}
