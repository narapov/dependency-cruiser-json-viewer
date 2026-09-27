import type { IModule } from 'dependency-cruiser';

import type { AggregatedDependency } from '../../../types';
import { makeDependencyKey } from '../../dependencyKey';

type ResolvedDep = IModule['dependencies'][number] & { resolved: string };

/**
 * Build a map of direct module dependencies keyed by `makeDependencyKey(source, target)`.
 * Includes external / unresolved-to-cruise targets when `resolved` is set.
 */
export function buildModulesDependencies(modules: readonly IModule[]): Map<string, AggregatedDependency[]> {
  const modulesDependencies = new Map<string, AggregatedDependency[]>();

  modules.forEach(module => {
    if (!Array.isArray(module.dependencies)) {
      return;
    }

    module.dependencies
      .filter((dep): dep is ResolvedDep => Boolean(dep.resolved))
      .forEach(dep => {
        const key = makeDependencyKey(module.source, dep.resolved);
        const entry: AggregatedDependency = {
          ...dep,
          id: key,
          source: module.source,
          target: dep.resolved,
        };

        const existing = modulesDependencies.get(key);
        if (existing) {
          existing.push(entry);
          return;
        }
        modulesDependencies.set(key, [entry]);
      });
  });

  return modulesDependencies;
}
