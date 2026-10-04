/** Move active path to the deepest collapsed ancestor when it would be hidden. */
export function resolveActivePathAfterCollapse(
  activePath: string | null,
  collapsedFolders: readonly string[],
  ancestors: readonly string[],
): string | null {
  if (!activePath || collapsedFolders.length === 0) {
    return activePath;
  }

  return ancestors.find(ancestor => collapsedFolders.includes(ancestor)) ?? activePath;
}
