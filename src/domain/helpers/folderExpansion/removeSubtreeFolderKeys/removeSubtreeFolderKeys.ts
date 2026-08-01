import { getSubtreeFolderKeys } from '../getSubtreeFolderKeys';

/** Remove a folder and all descendant folder keys from an expanded-keys list. */
export function removeSubtreeFolderKeys(keys: string[], folderPath: string, sources: string[]): string[] {
  const keysForRemove = getSubtreeFolderKeys(folderPath, sources);
  return keys.filter(key => !keysForRemove.has(key));
}
