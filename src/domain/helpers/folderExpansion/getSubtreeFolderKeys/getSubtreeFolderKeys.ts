import { getParentPath, isUnderFolder } from '../../pathUtils'

function isFolderPath(path: string, sources: string[]): boolean {
  return sources.some((source) => source.startsWith(`${path}/`))
}

export function getSubtreeFolderKeys(folderPath: string, sources: string[]): string[] {
  const folders = new Set<string>()

  if (isFolderPath(folderPath, sources)) {
    folders.add(folderPath)
  }

  for (const source of sources) {
    if (!isUnderFolder(source, folderPath) || source === folderPath) continue

    let current = getParentPath(source)
    while (current && isUnderFolder(current, folderPath)) {
      if (isFolderPath(current, sources)) {
        folders.add(current)
      }
      if (current === folderPath) break
      current = getParentPath(current)
    }
  }

  return [...folders]
}
