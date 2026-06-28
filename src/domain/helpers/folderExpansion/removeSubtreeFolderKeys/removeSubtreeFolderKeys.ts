import { getSubtreeFolderKeys } from '../getSubtreeFolderKeys'

export function removeSubtreeFolderKeys(
  keys: string[],
  folderPath: string,
  sources: string[],
): string[] {
  const remove = new Set(getSubtreeFolderKeys(folderPath, sources))
  return keys.filter((key) => !remove.has(key))
}
