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
