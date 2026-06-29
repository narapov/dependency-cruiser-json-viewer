import type { IModule } from 'dependency-cruiser';

import type { ModuleRelation, ModuleRelations } from '../../../types';
import {
  createDependencyRelationFlags,
  finalizeDependencyRelationFlags,
  isTypeOnlyDependency,
  mergeDependencyRelationFlags,
  type DependencyRelationFlags,
} from '../../dependencyUtils';
import { getRepresentative, isUnderFolder } from '../../pathUtils';

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

function mapToSortedArray(map: Map<string, DependencyRelationFlags>): ModuleRelation[] {
  return [...map.entries()]
    .map(([path, flags]) => {
      finalizeDependencyRelationFlags(flags);
      return {
        path,
        circular: flags.valueCircular,
        typeOnly: flags.typeOnly,
        typeOnlyCircular: flags.typeOnlyCircular,
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

export function getFolderRelations(
  folderPath: string,
  modules: IModule[],
  selectedPaths: string[],
  expandedFolders: Set<string>,
): ModuleRelations {
  const selectedSet = new Set(selectedPaths);
  const expanded = expandedFolders.has(folderPath);
  const dependencies = new Map<string, DependencyRelationFlags>();
  const dependents = new Map<string, DependencyRelationFlags>();

  for (const module of modules) {
    if (!selectedSet.has(module.source)) continue;
    if (!Array.isArray(module.dependencies)) continue;

    const sourceRep = getRepresentative(module.source, selectedSet, expandedFolders);
    const sourceUnder = isUnderFolder(module.source, folderPath);

    for (const dep of module.dependencies) {
      const resolved = dep.resolved;
      if (!resolved || !selectedSet.has(resolved)) continue;

      const targetRep = getRepresentative(resolved, selectedSet, expandedFolders);
      const targetUnder = isUnderFolder(resolved, folderPath);

      if (sourceRep === folderPath && targetRep !== folderPath) {
        mergeRelation(dependencies, targetRep, dep);
      }
      if (targetRep === folderPath && sourceRep !== folderPath) {
        mergeRelation(dependents, sourceRep, dep);
      }

      if (expanded) {
        if (sourceUnder && !targetUnder && targetRep !== folderPath) {
          mergeRelation(dependencies, targetRep, dep);
        }
        if (!sourceUnder && targetUnder && sourceRep !== folderPath) {
          mergeRelation(dependents, sourceRep, dep);
        }
      }
    }
  }

  return {
    dependencies: mapToSortedArray(dependencies),
    dependents: mapToSortedArray(dependents),
  };
}
