import type { CruiseEdge, CruiseSnapshot, ModuleRelations } from '../../../types';
import { deriveRelationFlagsFromAggregated, type DependencyRelationFlags } from '../../dependencyUtils';
import { buildRelationPathTree } from '../buildRelationPathTree';
import { flagsMapToSortedRelations } from '../mergeRelationGroups';

const EMPTY_RELATIONS: ModuleRelations = {
  dependencies: [],
  dependents: [],
  hiddenDependencies: [],
  hiddenDependents: [],
};

/** Merge a precomputed cruise edge into a path → flags map. */
function mergeCruiseEdge(map: Map<string, DependencyRelationFlags>, edge: CruiseEdge): void {
  const next = deriveRelationFlagsFromAggregated(edge.aggregated);
  const existing = map.get(edge.path);
  if (!existing) {
    map.set(edge.path, next);
    return;
  }

  existing.typeOnly = existing.typeOnly && next.typeOnly;
  if (next.valueCircular) {
    existing.valueCircular = true;
  }
  if (next.typeOnlyCircular) {
    existing.typeOnlyCircular = true;
  }
  if (existing.valueCircular) {
    existing.typeOnlyCircular = false;
  }
}

/** Incoming and outgoing relations for a single module path among selected and hidden paths. */
export function getModuleRelations(path: string, snapshot: CruiseSnapshot, selectedPaths: string[]): ModuleRelations {
  const node = snapshot.nodes.get(path);
  if (node == null || node.isFolder) {
    return EMPTY_RELATIONS;
  }

  const selectedSet = new Set(selectedPaths);
  const moduleSources = new Set(snapshot.descendantFiles);

  const dependencies = new Map<string, DependencyRelationFlags>();
  const dependents = new Map<string, DependencyRelationFlags>();
  const hiddenDependencies = new Map<string, DependencyRelationFlags>();
  const hiddenDependents = new Map<string, DependencyRelationFlags>();

  node.dependencies.forEach(edge => {
    if (selectedSet.has(edge.path)) {
      mergeCruiseEdge(dependencies, edge);
      return;
    }
    if (moduleSources.has(edge.path)) {
      mergeCruiseEdge(hiddenDependencies, edge);
    }
  });

  node.dependents.forEach(edge => {
    if (selectedSet.has(edge.path)) {
      mergeCruiseEdge(dependents, edge);
      return;
    }
    mergeCruiseEdge(hiddenDependents, edge);
  });

  return {
    dependencies: buildRelationPathTree(flagsMapToSortedRelations(dependencies)),
    dependents: buildRelationPathTree(flagsMapToSortedRelations(dependents)),
    hiddenDependencies: buildRelationPathTree(flagsMapToSortedRelations(hiddenDependencies)),
    hiddenDependents: buildRelationPathTree(flagsMapToSortedRelations(hiddenDependents)),
  };
}
