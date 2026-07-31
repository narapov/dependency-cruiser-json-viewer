import { getAncestorKeys, isNodeModulesPath } from '../../pathUtils';

function collectAllPaths(sources: string[]): Set<string> {
  const paths = new Set<string>();

  for (const source of sources) {
    paths.add(source);
    for (const ancestor of getAncestorKeys(source)) {
      paths.add(ancestor);
    }
  }

  return paths;
}

function getTopLevelFolderKeys(sources: string[]): string[] {
  const keys = new Set<string>();

  for (const source of sources) {
    const slash = source.indexOf('/');
    if (slash === -1) continue;
    keys.add(source.slice(0, slash));
  }

  return [...keys].sort();
}

/** Default selection: all paths under top-level folders except `node_modules`. */
export function getDefaultSelectedKeys(sources: string[]): string[] {
  const allPaths = collectAllPaths(sources);
  const selected = new Set<string>();

  for (const folder of getTopLevelFolderKeys(sources)) {
    if (isNodeModulesPath(folder)) continue;

    selected.add(folder);
    for (const path of allPaths) {
      if (isNodeModulesPath(path)) continue;
      if (path === folder || path.startsWith(`${folder}/`)) {
        selected.add(path);
      }
    }
  }

  return [...selected];
}
