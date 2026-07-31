import type { IModule } from 'dependency-cruiser';

import type { ModuleRelation, ModuleRelations } from '../../../types';
import {
  createDependencyRelationFlags,
  finalizeDependencyRelationFlags,
  isTypeOnlyDependency,
  mergeDependencyRelationFlags,
  type DependencyRelationFlags,
} from '../../dependencyUtils';

function flagsToRelation(path: string, flags: DependencyRelationFlags): ModuleRelation {
  finalizeDependencyRelationFlags(flags);
  return {
    path,
    circular: flags.valueCircular,
    typeOnly: flags.typeOnly,
    typeOnlyCircular: flags.typeOnlyCircular,
  };
}

function mergeRelation(
  map: Map<string, DependencyRelationFlags>,
  path: string,
  dep: IModule['dependencies'][number],
): Map<string, DependencyRelationFlags> {
  const isTypeOnly = isTypeOnlyDependency(dep);
  const isCircular = dep.circular === true;
  const existing = map.get(path);

  if (!existing) {
    map.set(path, createDependencyRelationFlags(isTypeOnly, isCircular));
  } else {
    mergeDependencyRelationFlags(existing, isTypeOnly, isCircular);
  }

  return map;
}

function flagsMapToSortedRelations(map: Map<string, DependencyRelationFlags>): ModuleRelation[] {
  return [...map.entries()]
    .map(([resolved, flags]) => flagsToRelation(resolved, flags))
    .sort((a, b) => a.path.localeCompare(b.path));
}

/** Incoming and outgoing relations for a single module path among selected paths. */
export function getModuleRelations(path: string, modules: IModule[], selectedPaths: string[]): ModuleRelations {
  const selectedSet = new Set(selectedPaths);
  const module = modules.find(m => m.source === path);

  const dependencyFlags =
    module && Array.isArray(module.dependencies)
      ? module.dependencies
          .filter(
            (dep): dep is typeof dep & { resolved: string } => Boolean(dep.resolved) && selectedSet.has(dep.resolved),
          )
          .reduce((map, dep) => mergeRelation(map, dep.resolved, dep), new Map<string, DependencyRelationFlags>())
      : new Map<string, DependencyRelationFlags>();

  const dependentFlags = modules
    .filter(other => selectedSet.has(other.source) && Array.isArray(other.dependencies))
    .flatMap(other =>
      other.dependencies.filter(dep => dep.resolved === path).map(dep => ({ source: other.source, dep })),
    )
    .reduce((map, { source, dep }) => mergeRelation(map, source, dep), new Map<string, DependencyRelationFlags>());

  return {
    dependencies: flagsMapToSortedRelations(dependencyFlags),
    dependents: flagsMapToSortedRelations(dependentFlags),
  };
}
