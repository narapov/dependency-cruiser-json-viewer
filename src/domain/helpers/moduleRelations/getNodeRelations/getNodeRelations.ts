import type { CruiseSnapshot, ModuleRelations } from '../../../types';
import { getFolderRelations } from '../getFolderRelations';
import { getModuleRelations } from '../getModuleRelations';

/** Relations for a graph node: module relations for files, folder relations otherwise. */
export function getNodeRelations(
  path: string,
  snapshot: CruiseSnapshot,
  selectedPaths: string[],
  expandedFolders: Set<string>,
): ModuleRelations {
  const node = snapshot.nodes.get(path);
  if (node == null) {
    return {
      dependencies: [],
      dependents: [],
      hiddenDependencies: [],
      hiddenDependents: [],
    };
  }
  if (!node.isFolder) {
    return getModuleRelations(path, snapshot, selectedPaths);
  }
  return getFolderRelations(path, snapshot, selectedPaths, expandedFolders);
}
