import type { IModule } from 'dependency-cruiser';

import { isUnderFolder } from '../../pathUtils';
import { makeDependencyKey } from '../makeDependencyKey';

export type DependencyKeysDirection = 'dependencies' | 'dependents';

function matchesPathOrUnder(resolved: string, path: string, isFilePath: boolean): boolean {
  return isFilePath ? resolved === path : isUnderFolder(resolved, path);
}

/** Module dependency keys for the relation between a panel/source path and a related path. */
export function getDependencyKeysBetweenPaths(
  sourcePath: string,
  targetPath: string,
  direction: DependencyKeysDirection,
  modules: readonly IModule[],
): string[] {
  const isFileSource = modules.some(module => module.source === sourcePath);
  const isFileTarget = modules.some(module => module.source === targetPath);

  if (direction === 'dependencies') {
    if (isFileSource) {
      const module = modules.find(m => m.source === sourcePath);
      if (!module || !Array.isArray(module.dependencies)) {
        return [];
      }

      return module.dependencies
        .filter(
          (dep): dep is typeof dep & { resolved: string } =>
            typeof dep.resolved === 'string' && matchesPathOrUnder(dep.resolved, targetPath, isFileTarget),
        )
        .map(dep => makeDependencyKey(sourcePath, dep.resolved));
    }

    return modules
      .filter(module => isUnderFolder(module.source, sourcePath) && module.source !== sourcePath)
      .flatMap(module =>
        module.dependencies
          .filter(
            (dep): dep is typeof dep & { resolved: string } =>
              typeof dep.resolved === 'string' && matchesPathOrUnder(dep.resolved, targetPath, isFileTarget),
          )
          .map(dep => makeDependencyKey(module.source, dep.resolved)),
      );
  }

  if (isFileTarget) {
    const module = modules.find(m => m.source === targetPath);
    if (!module || !Array.isArray(module.dependencies)) {
      return [];
    }

    return module.dependencies
      .filter(
        (dep): dep is typeof dep & { resolved: string } =>
          typeof dep.resolved === 'string' && matchesPathOrUnder(dep.resolved, sourcePath, isFileSource),
      )
      .map(dep => makeDependencyKey(targetPath, dep.resolved));
  }

  return modules
    .filter(module => isUnderFolder(module.source, targetPath) && module.source !== targetPath)
    .flatMap(module =>
      module.dependencies
        .filter(
          (dep): dep is typeof dep & { resolved: string } =>
            typeof dep.resolved === 'string' && matchesPathOrUnder(dep.resolved, sourcePath, isFileSource),
        )
        .map(dep => makeDependencyKey(module.source, dep.resolved)),
    );
}
