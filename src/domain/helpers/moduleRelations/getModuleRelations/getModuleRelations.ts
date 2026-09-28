import type { CruiseSnapshot, ModuleDependency, ModuleRelations } from '../../../types';
import { getCruiseSources } from '../../cruiseSnapshot';
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
function mergeCruiseEdge(
  map: Map<string, DependencyRelationFlags>,
  path: string,
  aggregated: ModuleDependency[],
): void {
  const next = deriveRelationFlagsFromAggregated(aggregated);
  const existing = map.get(path);
  if (!existing) {
    map.set(path, next);
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

/** Walk dependency buckets keyed by dep id and merge by endpoint path. */
function mergeDependencyBuckets(
  buckets: ReadonlyMap<string, ModuleDependency[]>,
  endpoint: 'source' | 'target',
  selectedSet: Set<string>,
  moduleSources: Set<string>,
  selectedMap: Map<string, DependencyRelationFlags>,
  hiddenMap: Map<string, DependencyRelationFlags>,
  hiddenPolicy: 'selected-modules-only' | 'all-unselected',
): void {
  buckets.forEach(aggregated => {
    const first = aggregated[0];
    if (first == null) {
      return;
    }
    const path = endpoint === 'target' ? first.target : first.source;
    if (selectedSet.has(path)) {
      mergeCruiseEdge(selectedMap, path, aggregated);
      return;
    }
    if (hiddenPolicy === 'all-unselected' || moduleSources.has(path)) {
      mergeCruiseEdge(hiddenMap, path, aggregated);
    }
  });
}

/** Incoming and outgoing relations for a single module path among selected and hidden paths. */
export function getModuleRelations(path: string, snapshot: CruiseSnapshot, selectedPaths: string[]): ModuleRelations {
  const node = snapshot.nodes.get(path);
  if (node == null || node.isFolder) {
    return EMPTY_RELATIONS;
  }

  const selectedSet = new Set(selectedPaths);
  const moduleSources = new Set(getCruiseSources(snapshot));

  const dependencies = new Map<string, DependencyRelationFlags>();
  const dependents = new Map<string, DependencyRelationFlags>();
  const hiddenDependencies = new Map<string, DependencyRelationFlags>();
  const hiddenDependents = new Map<string, DependencyRelationFlags>();

  mergeDependencyBuckets(
    node.externalDependencies,
    'target',
    selectedSet,
    moduleSources,
    dependencies,
    hiddenDependencies,
    'selected-modules-only',
  );
  mergeDependencyBuckets(
    node.externalDependents,
    'source',
    selectedSet,
    moduleSources,
    dependents,
    hiddenDependents,
    'all-unselected',
  );

  return {
    dependencies: buildRelationPathTree(flagsMapToSortedRelations(dependencies)),
    dependents: buildRelationPathTree(flagsMapToSortedRelations(dependents)),
    hiddenDependencies: buildRelationPathTree(flagsMapToSortedRelations(hiddenDependencies)),
    hiddenDependents: buildRelationPathTree(flagsMapToSortedRelations(hiddenDependents)),
  };
}
