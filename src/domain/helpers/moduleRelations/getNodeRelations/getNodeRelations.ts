import type { IModule } from 'dependency-cruiser';

import type { ModuleRelations } from '../../../types';
import { getFolderRelations } from '../getFolderRelations';
import { getModuleRelations } from '../getModuleRelations';

export function getNodeRelations(
  path: string,
  modules: IModule[],
  selectedPaths: string[],
  expandedFolders: Set<string>,
): ModuleRelations {
  const isFile = modules.some(m => m.source === path);
  if (isFile) {
    return getModuleRelations(path, modules, selectedPaths);
  }
  return getFolderRelations(path, modules, selectedPaths, expandedFolders);
}
