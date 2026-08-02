import type { IModule } from 'dependency-cruiser';

import type { ModuleRelations } from '../../../types';
import type { DependencyRelationFlags } from '../../dependencyUtils';
import { getRepresentative, isUnderFolder } from '../../pathUtils';
import { buildRelationPathTree } from '../buildRelationPathTree';
import { flagsMapToSortedRelations, mergeRelation } from '../mergeRelationGroups';

type ModuleDep = IModule['dependencies'][number];

interface RelationCandidate {
  map: Map<string, DependencyRelationFlags>;
  path: string;
  dep: ModuleDep;
}

interface RelationMaps {
  dependencies: Map<string, DependencyRelationFlags>;
  dependents: Map<string, DependencyRelationFlags>;
  hiddenDependencies: Map<string, DependencyRelationFlags>;
  hiddenDependents: Map<string, DependencyRelationFlags>;
}

interface FolderContext {
  folderPath: string;
  selectedSet: Set<string>;
  moduleSources: Set<string>;
  expandedFolders: Set<string>;
  expanded: boolean;
  maps: RelationMaps;
}

/** Whether a module endpoint belongs to the focused folder node given expansion state. */
function belongsToFolder(
  path: string,
  folderPath: string,
  selectedSet: Set<string>,
  expandedFolders: Set<string>,
  expanded: boolean,
): boolean {
  const rep = getRepresentative(path, selectedSet, expandedFolders);
  return rep === folderPath || (expanded && isUnderFolder(path, folderPath));
}

/** Visible selected↔selected edges that cross the folder boundary. */
function collectVisibleCandidates(
  module: IModule,
  dep: ModuleDep & { resolved: string },
  ctx: FolderContext,
): RelationCandidate[] {
  const { folderPath, selectedSet, expandedFolders, expanded, maps } = ctx;
  const sourceRep = getRepresentative(module.source, selectedSet, expandedFolders);
  const targetRep = getRepresentative(dep.resolved, selectedSet, expandedFolders);
  const sourceUnder = isUnderFolder(module.source, folderPath);
  const targetUnder = isUnderFolder(dep.resolved, folderPath);
  const candidates: RelationCandidate[] = [];

  if (sourceRep === folderPath && targetRep !== folderPath) {
    candidates.push({ map: maps.dependencies, path: dep.resolved, dep });
  }
  if (targetRep === folderPath && sourceRep !== folderPath) {
    candidates.push({ map: maps.dependents, path: module.source, dep });
  }
  if (!expanded) {
    return candidates;
  }
  if (sourceUnder && !targetUnder && targetRep !== folderPath) {
    candidates.push({ map: maps.dependencies, path: dep.resolved, dep });
  }
  if (!sourceUnder && targetUnder && sourceRep !== folderPath) {
    candidates.push({ map: maps.dependents, path: module.source, dep });
  }
  return candidates;
}

/** Hidden edges to/from unselected modules that cross the folder boundary. */
function collectHiddenCandidates(
  module: IModule,
  dep: ModuleDep & { resolved: string },
  ctx: FolderContext,
): RelationCandidate[] {
  const { folderPath, selectedSet, moduleSources, expandedFolders, expanded, maps } = ctx;
  const sourceSelected = selectedSet.has(module.source);
  const targetSelected = selectedSet.has(dep.resolved);
  const sourceUnder = isUnderFolder(module.source, folderPath);
  const targetUnder = isUnderFolder(dep.resolved, folderPath);
  const candidates: RelationCandidate[] = [];

  if (
    sourceSelected &&
    !targetSelected &&
    moduleSources.has(dep.resolved) &&
    belongsToFolder(module.source, folderPath, selectedSet, expandedFolders, expanded) &&
    !targetUnder
  ) {
    candidates.push({ map: maps.hiddenDependencies, path: dep.resolved, dep });
  }

  if (
    targetSelected &&
    !sourceSelected &&
    belongsToFolder(dep.resolved, folderPath, selectedSet, expandedFolders, expanded) &&
    !sourceUnder
  ) {
    candidates.push({ map: maps.hiddenDependents, path: module.source, dep });
  }

  return candidates;
}

/** Collect visible and hidden relation candidates that cross the folder boundary. */
function collectRelationCandidates(modules: IModule[], ctx: FolderContext): RelationCandidate[] {
  return modules.flatMap(module => {
    if (!Array.isArray(module.dependencies)) {
      return [];
    }

    return module.dependencies
      .filter((dep): dep is ModuleDep & { resolved: string } => Boolean(dep.resolved))
      .flatMap(dep => {
        const sourceSelected = ctx.selectedSet.has(module.source);
        const targetSelected = ctx.selectedSet.has(dep.resolved);

        if (sourceSelected && targetSelected) {
          return collectVisibleCandidates(module, dep, ctx);
        }
        return collectHiddenCandidates(module, dep, ctx);
      });
  });
}

/** Incoming and outgoing relations for a folder node as a nested path tree. */
export function getFolderRelations(
  folderPath: string,
  modules: IModule[],
  selectedPaths: string[],
  expandedFolders: Set<string>,
): ModuleRelations {
  const selectedSet = new Set(selectedPaths);
  const moduleSources = new Set(modules.map(module => module.source));
  const maps: RelationMaps = {
    dependencies: new Map(),
    dependents: new Map(),
    hiddenDependencies: new Map(),
    hiddenDependents: new Map(),
  };

  collectRelationCandidates(modules, {
    folderPath,
    selectedSet,
    moduleSources,
    expandedFolders,
    expanded: expandedFolders.has(folderPath),
    maps,
  }).forEach(candidate => {
    mergeRelation(candidate.map, candidate.path, candidate.dep);
  });

  return {
    dependencies: buildRelationPathTree(flagsMapToSortedRelations(maps.dependencies)),
    dependents: buildRelationPathTree(flagsMapToSortedRelations(maps.dependents)),
    hiddenDependencies: buildRelationPathTree(flagsMapToSortedRelations(maps.hiddenDependencies)),
    hiddenDependents: buildRelationPathTree(flagsMapToSortedRelations(maps.hiddenDependents)),
  };
}
