import type { IModule } from 'dependency-cruiser';

import { collectSourcesUnderFolder } from '../collectSourcesUnderFolder';

/** Module JSON for a file path, or all nested modules under a folder path. */
export function getModuleJsonData(path: string, allModules: readonly IModule[]): IModule | IModule[] | null {
  const fileModule = allModules.find(module => module.source === path);
  if (fileModule != null) {
    return fileModule;
  }

  const sources = new Set(
    collectSourcesUnderFolder(
      path,
      allModules.map(module => module.source),
    ),
  );
  if (sources.size === 0) {
    return null;
  }

  return allModules.filter(module => sources.has(module.source));
}
