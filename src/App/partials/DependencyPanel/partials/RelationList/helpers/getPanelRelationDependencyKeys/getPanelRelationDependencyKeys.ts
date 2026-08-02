import type { IModule } from 'dependency-cruiser';

import { isUnderFolder, makeDependencyKey } from '@/domain';

export type PanelRelationDirection = 'dependencies' | 'dependents';

/** Dependency keys for a leaf relation row in the dependency panel. */
export function getPanelRelationDependencyKeys(
  panelPath: string,
  relationPath: string,
  direction: PanelRelationDirection,
  modules: IModule[],
): string[] {
  const isFilePanel = modules.some(module => module.source === panelPath);

  if (isFilePanel) {
    return [
      direction === 'dependencies'
        ? makeDependencyKey(panelPath, relationPath)
        : makeDependencyKey(relationPath, panelPath),
    ];
  }

  if (direction === 'dependencies') {
    return modules
      .filter(module => isUnderFolder(module.source, panelPath))
      .flatMap(module =>
        module.dependencies
          .filter((dep): dep is typeof dep & { resolved: string } => dep.resolved === relationPath)
          .map(dep => makeDependencyKey(module.source, dep.resolved)),
      );
  }

  return modules
    .filter(module => module.source === relationPath)
    .flatMap(module =>
      module.dependencies
        .filter(
          (dep): dep is typeof dep & { resolved: string } =>
            Boolean(dep.resolved) && isUnderFolder(dep.resolved, panelPath),
        )
        .map(dep => makeDependencyKey(module.source, dep.resolved)),
    );
}
