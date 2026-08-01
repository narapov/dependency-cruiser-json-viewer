import { getParentPath, isUnderFolder } from '../../pathUtils';

/** Folder paths in the subtree rooted at folderPath, including the root when it is a folder. */
export function getSubtreeFolderKeys(folderPath: string, sources: string[]): Set<string> {
  return sources.reduce((acc, source) => {
    if (!isUnderFolder(source, folderPath) || source === folderPath) {
      return acc;
    }

    let current = getParentPath(source);
    while (current && isUnderFolder(current, folderPath)) {
      acc.add(current);
      current = getParentPath(current);
    }

    return acc;
  }, new Set<string>());
}
