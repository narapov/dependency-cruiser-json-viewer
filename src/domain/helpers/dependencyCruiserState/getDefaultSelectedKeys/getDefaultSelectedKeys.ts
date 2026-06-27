import { getParentPath, isNodeModulesPath } from '../../pathUtils'

function collectAllPaths(sources: string[]): Set<string> {
  const paths = new Set<string>()

  for (const source of sources) {
    paths.add(source)
    let current = source
    while (true) {
      const parent = getParentPath(current)
      if (!parent) break
      paths.add(parent)
      current = parent
    }
  }

  return paths
}

function getTopLevelFolderKeys(sources: string[]): string[] {
  const keys = new Set<string>()

  for (const source of sources) {
    const slash = source.indexOf('/')
    if (slash === -1) continue
    keys.add(source.slice(0, slash))
  }

  return [...keys].sort()
}

export function getDefaultSelectedKeys(sources: string[]): string[] {
  const allPaths = collectAllPaths(sources)
  const selected = new Set<string>()

  for (const folder of getTopLevelFolderKeys(sources)) {
    if (isNodeModulesPath(folder)) continue

    selected.add(folder)
    for (const path of allPaths) {
      if (isNodeModulesPath(path)) continue
      if (path === folder || path.startsWith(`${folder}/`)) {
        selected.add(path)
      }
    }
  }

  return [...selected]
}
