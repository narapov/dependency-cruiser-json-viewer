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
): void {
  const isTypeOnly = isTypeOnlyDependency(dep);
  const isCircular = dep.circular === true;
  const existing = map.get(path);

  if (!existing) {
    map.set(path, createDependencyRelationFlags(isTypeOnly, isCircular));
    return;
  }

  mergeDependencyRelationFlags(existing, isTypeOnly, isCircular);
}

export function getModuleRelations(path: string, modules: IModule[], selectedPaths: string[]): ModuleRelations {
  const selectedSet = new Set(selectedPaths);
  const module = modules.find(m => m.source === path);

  const dependencyFlags = new Map<string, DependencyRelationFlags>();
  if (module && Array.isArray(module.dependencies)) {
    for (const dep of module.dependencies) {
      const resolved = dep.resolved;
      if (!resolved || !selectedSet.has(resolved)) continue;
      mergeRelation(dependencyFlags, resolved, dep);
    }
  }

  const dependencies = [...dependencyFlags.entries()]
    .map(([resolved, flags]) => flagsToRelation(resolved, flags))
    .sort((a, b) => a.path.localeCompare(b.path));

  const dependentFlags = new Map<string, DependencyRelationFlags>();
  for (const other of modules) {
    if (!selectedSet.has(other.source)) continue;
    if (!Array.isArray(other.dependencies)) continue;

    for (const dep of other.dependencies) {
      if (dep.resolved !== path) continue;
      mergeRelation(dependentFlags, other.source, dep);
    }
  }

  const dependents = [...dependentFlags.entries()]
    .map(([source, flags]) => flagsToRelation(source, flags))
    .sort((a, b) => a.path.localeCompare(b.path));

  return { dependencies, dependents };
}
