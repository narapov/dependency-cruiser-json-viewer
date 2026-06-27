export function getParentPath(path: string): string | null {
  const lastSlash = path.lastIndexOf('/')
  if (lastSlash === -1) return null
  return path.slice(0, lastSlash)
}
