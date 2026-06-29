export function resolveActivePathAfterCollapse(activePath: string | null, collapsedFolders: string[]): string | null {
  if (!activePath || collapsedFolders.length === 0) return activePath;

  let deepestMatch: string | null = null;
  for (const folder of collapsedFolders) {
    if (activePath.startsWith(`${folder}/`)) {
      if (!deepestMatch || folder.length > deepestMatch.length) {
        deepestMatch = folder;
      }
    }
  }
  return deepestMatch ?? activePath;
}
