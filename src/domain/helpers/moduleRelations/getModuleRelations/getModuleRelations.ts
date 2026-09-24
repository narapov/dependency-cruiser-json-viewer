import type { CruiseEdge, CruiseTreeSnapshot, ModuleRelations } from '../../../types';
import { finalizeDependencyRelationFlags, type DependencyRelationFlags } from '../../dependencyUtils';
import { buildRelationPathTree } from '../buildRelationPathTree';
import { flagsMapToSortedRelations } from '../mergeRelationGroups';

const EMPTY_RELATIONS: ModuleRelations = {
  dependencies: [],
  dependents: [],
  hiddenDependencies: [],
  hiddenDependents: [],
};

/** Convert a snapshot edge into mutable relation flags. */
function cruiseEdgeToFlags(edge: CruiseEdge): DependencyRelationFlags {
  return {
    typeOnly: edge.typeOnly,
    valueCircular: edge.circular,
    typeOnlyCircular: edge.typeOnlyCircular,
  };
}

/** Merge a precomputed cruise edge into a path → flags map. */
function mergeCruiseEdge(map: Map<string, DependencyRelationFlags>, edge: CruiseEdge): void {
  const existing = map.get(edge.path);
  if (!existing) {
    map.set(edge.path, cruiseEdgeToFlags(edge));
    return;
  }

  existing.typeOnly = existing.typeOnly && edge.typeOnly;
  if (edge.circular) {
    existing.valueCircular = true;
  }
  if (edge.typeOnlyCircular) {
    existing.typeOnlyCircular = true;
  }
  finalizeDependencyRelationFlags(existing);
}

/** Incoming and outgoing relations for a single module path among selected and hidden paths. */
export function getModuleRelations(
  path: string,
  snapshot: CruiseTreeSnapshot,
  selectedPaths: string[],
): ModuleRelations {
  const node = snapshot.nodes.get(path);
  if (node == null || node.isFolder) {
    return EMPTY_RELATIONS;
  }

  const selectedSet = new Set(selectedPaths);
  const moduleSources = new Set(snapshot.modulePaths);

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
