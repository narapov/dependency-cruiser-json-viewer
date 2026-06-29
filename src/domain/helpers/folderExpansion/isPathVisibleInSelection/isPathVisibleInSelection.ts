export function isPathVisibleInSelection(path: string, selectedPaths: string[]): boolean {
  if (selectedPaths.includes(path)) return true;
  return selectedPaths.some(selected => selected.startsWith(`${path}/`));
}
