import type { IModule } from 'dependency-cruiser';

import type { ModuleDependency } from '../../../types';
import { makeDependencyKey } from '../../dependencyKey';
import { getAncestorKeys, toBuiltInSnapshotPath } from '../../pathUtils';

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
 * Core-module endpoints are indexed under `:buildIn:` (protocol prefixes the leaf when set).
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

    const source = module.coreModule ? toBuiltInSnapshotPath(module.source) : module.source;

    module.dependencies
      .filter((dep): dep is ResolvedDep => Boolean(dep.resolved))
      .forEach(dep => {
        const target = dep.coreModule ? toBuiltInSnapshotPath(dep.resolved, dep.protocol) : dep.resolved;
        const key = makeDependencyKey(source, target);
        const sourceAncestors = getAncestorKeys(source);
        const targetAncestors = getAncestorKeys(target);

        const moduleDependency: ModuleDependency = {
          id: key,
          source,
          sourceAncestors,
          target,
          targetAncestors,
          ...dep,
          resolved: target,
        };

        pushOrCreateToModuleDependencyMap(modulesDependenciesByDependencyKey, key, moduleDependency);
        [...sourceAncestors, source].forEach(s =>
          pushOrCreateToModuleDependencyMap(modulesDependenciesBySource, s, moduleDependency),
        );
        [...targetAncestors, target].forEach(t =>
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
