/** Move active path to the deepest collapsed ancestor when it would be hidden. */
export function resolveActivePathAfterCollapse(activePath: string | null, collapsedFolders: string[]): string | null {
  if (!activePath || collapsedFolders.length === 0) {
    return activePath;
  }

  const deepestMatch = collapsedFolders
    .filter(folder => activePath.startsWith(`${folder}/`))
    .reduce<string | null>((deepest, folder) => (!deepest || folder.length > deepest.length ? folder : deepest), null);

  return deepestMatch ?? activePath;
}
