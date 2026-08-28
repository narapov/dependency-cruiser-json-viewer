import type { IModule } from 'dependency-cruiser';

import { isUnderFolder } from '../../pathUtils';

export type RelatedModuleDirection = 'dependencies' | 'dependents';

/** Flat module source paths related to a file or folder node in one direction. */
export function collectRelatedModuleSources(
  path: string,
  modules: readonly IModule[],
  direction: RelatedModuleDirection,
): string[] {
  const moduleSources = new Set(modules.map(module => module.source));
  const isFile = moduleSources.has(path);

  if (isFile) {
    return collectFileRelatedSources(path, modules, direction, moduleSources);
  }

  return collectFolderRelatedSources(path, modules, direction, moduleSources);
}

function collectFileRelatedSources(
  path: string,
  modules: readonly IModule[],
  direction: RelatedModuleDirection,
  moduleSources: Set<string>,
): string[] {
  if (direction === 'dependencies') {
    const module = modules.find(m => m.source === path);
    if (!module || !Array.isArray(module.dependencies)) {
      return [];
    }

    return [
      ...new Set(
        module.dependencies
          .map(dep => dep.resolved)
          .filter((resolved): resolved is string => typeof resolved === 'string' && moduleSources.has(resolved)),
      ),
    ];
  }

  return [
    ...new Set(
      modules
        .filter(other => Array.isArray(other.dependencies) && other.dependencies.some(dep => dep.resolved === path))
        .map(other => other.source),
    ),
  ];
}

function collectFolderRelatedSources(
  folderPath: string,
  modules: readonly IModule[],
  direction: RelatedModuleDirection,
  moduleSources: Set<string>,
): string[] {
  const related = new Set<string>();

  modules.forEach(module => {
    if (!Array.isArray(module.dependencies)) {
      return;
    }

    const sourceUnder = isUnderFolder(module.source, folderPath) && module.source !== folderPath;

    module.dependencies.forEach(dep => {
      if (typeof dep.resolved !== 'string' || !moduleSources.has(dep.resolved)) {
        return;
      }

      const targetUnder = isUnderFolder(dep.resolved, folderPath) && dep.resolved !== folderPath;

      if (direction === 'dependencies' && sourceUnder && !targetUnder) {
        related.add(dep.resolved);
      }

      if (direction === 'dependents' && targetUnder && !sourceUnder) {
        related.add(module.source);
      }
    });
  });

  return [...related];
}
