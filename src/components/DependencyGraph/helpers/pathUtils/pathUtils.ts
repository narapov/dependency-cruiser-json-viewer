export function getParentPath(path: string): string | null {
  const lastSlash = path.lastIndexOf('/')
  if (lastSlash === -1) return null
  return path.slice(0, lastSlash)
}

export function getBaseName(path: string): string {
  const lastSlash = path.lastIndexOf('/')
  return lastSlash === -1 ? path : path.slice(lastSlash + 1)
}

export function getAncestorKeys(key: string): string[] {
  const ancestors: string[] = []
  let current = getParentPath(key)
  while (current) {
    ancestors.push(current)
    current = getParentPath(current)
  }
  return ancestors
}

export function isUnderFolder(filePath: string, folderPath: string): boolean {
  return filePath === folderPath || filePath.startsWith(`${folderPath}/`)
}

export function getRepresentative(
  path: string,
  selectedSet: Set<string>,
  expandedFolders: Set<string>,
): string {
  let current = path
  while (true) {
    const parent = getParentPath(current)
    if (!parent || !selectedSet.has(parent) || expandedFolders.has(parent)) break
    current = parent
  }
  return current
}
