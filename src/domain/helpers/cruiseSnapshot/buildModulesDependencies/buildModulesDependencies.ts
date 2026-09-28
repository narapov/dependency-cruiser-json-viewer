import type { IModule } from 'dependency-cruiser';

import type { ModuleDependency } from '../../../types';
import { makeDependencyKey } from '../../dependencyKey';
import { getAncestorKeys } from '../../pathUtils';

type ResolvedDep = IModule['dependencies'][number] & { resolved: string };

function pushOrCreateToModuleDependencyMap(
  modulesDependenciesMap: Map<string, ModuleDependency[]>,
  key: string,
  moduleDependency: ModuleDependency,
) {
  const existing = modulesDependenciesMap.get(key);
  if (existing) {
    existing.push(moduleDependency);
    return;
  }
  modulesDependenciesMap.set(key, [moduleDependency]);
}

/**
 * Build a map of direct module dependencies keyed by `makeDependencyKey(source, target)`.
 * Includes external / unresolved-to-cruise targets when `resolved` is set.
 */
export function buildModulesDependencies(modules: readonly IModule[]): {
  modulesDependenciesByDependencyKey: ReadonlyMap<string, ModuleDependency[]>;
  modulesDependenciesBySource: ReadonlyMap<string, ModuleDependency[]>;
  modulesDependenciesByTarget: ReadonlyMap<string, ModuleDependency[]>;
} {
  const modulesDependenciesByDependencyKey = new Map<string, ModuleDependency[]>();
  const modulesDependenciesBySource = new Map<string, ModuleDependency[]>();
  const modulesDependenciesByTarget = new Map<string, ModuleDependency[]>();

  modules.forEach(module => {
    if (!Array.isArray(module.dependencies)) {
      return;
    }

    module.dependencies
      .filter((dep): dep is ResolvedDep => Boolean(dep.resolved))
      .forEach(dep => {
        const key = makeDependencyKey(module.source, dep.resolved);
        const sourceAncestors = getAncestorKeys(module.source);
        const targetAncestors = getAncestorKeys(dep.resolved);

        const moduleDependency: ModuleDependency = {
          id: key,
          source: module.source,
          sourceAncestors,
          target: dep.resolved,
          targetAncestors,
          ...dep,
        };

        pushOrCreateToModuleDependencyMap(modulesDependenciesByDependencyKey, key, moduleDependency);
        [...sourceAncestors, module.source].forEach(s =>
          pushOrCreateToModuleDependencyMap(modulesDependenciesBySource, s, moduleDependency),
        );
        [...targetAncestors, dep.resolved].forEach(t =>
          pushOrCreateToModuleDependencyMap(modulesDependenciesByTarget, t, moduleDependency),
        );
      });
  });

  return {
    modulesDependenciesByDependencyKey,
    modulesDependenciesBySource,
    modulesDependenciesByTarget,
  };
}
