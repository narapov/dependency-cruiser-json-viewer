import type { IModule } from 'dependency-cruiser';

import type { ModuleRelations } from '../../../types';
import type { DependencyRelationFlags } from '../../dependencyUtils';
import { buildRelationPathTree } from '../buildRelationPathTree';
import { flagsMapToSortedRelations, mergeRelation } from '../mergeRelationGroups';

/** Incoming and outgoing relations for a single module path among selected and hidden paths. */
export function getModuleRelations(path: string, modules: IModule[], selectedPaths: string[]): ModuleRelations {
  const selectedSet = new Set(selectedPaths);
  const moduleSources = new Set(modules.map(module => module.source));
  const module = modules.find(m => m.source === path);

  const dependencies = new Map<string, DependencyRelationFlags>();
  const dependents = new Map<string, DependencyRelationFlags>();
  const hiddenDependencies = new Map<string, DependencyRelationFlags>();
  const hiddenDependents = new Map<string, DependencyRelationFlags>();

  if (module && Array.isArray(module.dependencies)) {
    module.dependencies
      .filter((dep): dep is typeof dep & { resolved: string } => Boolean(dep.resolved))
      .forEach(dep => {
        if (selectedSet.has(dep.resolved)) {
          mergeRelation(dependencies, dep.resolved, dep);
          return;
        }
        if (moduleSources.has(dep.resolved)) {
          mergeRelation(hiddenDependencies, dep.resolved, dep);
        }
      });
  }

  modules
    .filter(other => Array.isArray(other.dependencies))
    .forEach(other => {
      other.dependencies
        .filter(dep => dep.resolved === path)
        .forEach(dep => {
          if (selectedSet.has(other.source)) {
            mergeRelation(dependents, other.source, dep);
            return;
          }
          mergeRelation(hiddenDependents, other.source, dep);
        });
    });

  return {
    dependencies: buildRelationPathTree(flagsMapToSortedRelations(dependencies)),
    dependents: buildRelationPathTree(flagsMapToSortedRelations(dependents)),
    hiddenDependencies: buildRelationPathTree(flagsMapToSortedRelations(hiddenDependencies)),
    hiddenDependents: buildRelationPathTree(flagsMapToSortedRelations(hiddenDependents)),
  };
}
