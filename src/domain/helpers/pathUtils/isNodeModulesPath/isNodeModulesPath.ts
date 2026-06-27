export function isNodeModulesPath(path: string): boolean {
  return path.split('/').includes('node_modules')
}
