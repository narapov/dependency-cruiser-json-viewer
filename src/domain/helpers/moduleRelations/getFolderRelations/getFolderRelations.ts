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

type ModuleDep = IModule['dependencies'][number];

function mergeRelation(
  map: Map<string, DependencyRelationFlags>,
  path: string,
  dep: ModuleDep,
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

interface RelationCandidate {
  mapKey: 'dependencies' | 'dependents';
  path: string;
  dep: ModuleDep;
}

function collectRelationCandidates(
  folderPath: string,
  modules: IModule[],
  selectedSet: Set<string>,
  expandedFolders: Set<string>,
  expanded: boolean,
): RelationCandidate[] {
  return modules
    .filter(module => selectedSet.has(module.source) && Array.isArray(module.dependencies))
    .flatMap(module => {
      const sourceRep = getRepresentative(module.source, selectedSet, expandedFolders);
      const sourceUnder = isUnderFolder(module.source, folderPath);

      return module.dependencies
        .filter(
          (dep): dep is ModuleDep & { resolved: string } => Boolean(dep.resolved) && selectedSet.has(dep.resolved),
        )
        .flatMap(dep => {
          const targetRep = getRepresentative(dep.resolved, selectedSet, expandedFolders);
          const targetUnder = isUnderFolder(dep.resolved, folderPath);
          const candidates: RelationCandidate[] = [];

          if (sourceRep === folderPath && targetRep !== folderPath) {
            candidates.push({ mapKey: 'dependencies', path: targetRep, dep });
          }
          if (targetRep === folderPath && sourceRep !== folderPath) {
            candidates.push({ mapKey: 'dependents', path: sourceRep, dep });
          }
          if (expanded) {
            if (sourceUnder && !targetUnder && targetRep !== folderPath) {
              candidates.push({ mapKey: 'dependencies', path: targetRep, dep });
            }
            if (!sourceUnder && targetUnder && sourceRep !== folderPath) {
              candidates.push({ mapKey: 'dependents', path: sourceRep, dep });
            }
          }

          return candidates;
        });
    });
}

/** Incoming and outgoing relations for a folder node, collapsed to visible representatives. */
export function getFolderRelations(
  folderPath: string,
  modules: IModule[],
  selectedPaths: string[],
  expandedFolders: Set<string>,
): ModuleRelations {
  const selectedSet = new Set(selectedPaths);
  const expanded = expandedFolders.has(folderPath);

  const { dependencies, dependents } = collectRelationCandidates(
    folderPath,
    modules,
    selectedSet,
    expandedFolders,
    expanded,
  ).reduce(
    (acc, candidate) => {
      mergeRelation(acc[candidate.mapKey], candidate.path, candidate.dep);
      return acc;
    },
    {
      dependencies: new Map<string, DependencyRelationFlags>(),
      dependents: new Map<string, DependencyRelationFlags>(),
    },
  );

  return {
    dependencies: mapToSortedArray(dependencies),
    dependents: mapToSortedArray(dependents),
  };
}
