import type { CruiseSnapshot } from '../../../types';

export type DependencyKeysDirection = 'dependencies' | 'dependents';

/** Whether `filePath` equals `path` (file) or lies under `path`'s descendant files (folder). */
function pathMatchesFile(filePath: string, path: string, snapshot: CruiseSnapshot): boolean {
  const node = snapshot.nodes.get(path);
  if (node == null) {
    return false;
  }
  if (!node.isFolder) {
    return filePath === path;
  }
  return node.descendantFiles.has(filePath);
}

/** Module dependency keys for the relation between a panel/source path and a related path. */
export function getDependencyKeysBetweenPaths(
  snapshot: CruiseSnapshot,
  sourcePath: string,
  targetPath: string,
  direction: DependencyKeysDirection,
): string[] {
  const sourceNode = snapshot.nodes.get(sourcePath);
  if (sourceNode == null) {
    return [];
  }

  const keys = new Set<string>();

  if (direction === 'dependencies') {
    sourceNode.externalDependencies.forEach(aggregated => {
      aggregated.forEach(dep => {
        if (pathMatchesFile(dep.target, targetPath, snapshot)) {
          keys.add(dep.id);
        }
      });
    });
  } else {
    sourceNode.externalDependents.forEach(aggregated => {
      aggregated.forEach(dep => {
        if (pathMatchesFile(dep.source, targetPath, snapshot)) {
          keys.add(dep.id);
        }
      });
    });
  }

  return [...keys];
}
