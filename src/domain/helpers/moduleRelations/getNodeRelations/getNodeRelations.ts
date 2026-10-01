import type { CruiseSnapshot, ModuleDependency, ModuleRelation, ModuleRelations } from '../../../types';
import { deriveRelationFlagsFromAggregated } from '../../dependencyUtils';
import { buildRelationPathTree } from '../buildRelationPathTree';

const EMPTY_RELATIONS: ModuleRelations = {
  dependencies: [],
  dependents: [],
  hiddenDependencies: [],
  hiddenDependents: [],
};

/**
 * Split external edge buckets into visible vs hidden path trees.
 * Opposite endpoint selected → visible; otherwise hidden.
 */
function splitExternalByVisibility(
  buckets: ReadonlyMap<string, ModuleDependency[]>,
  endpoint: 'source' | 'target',
  selectedFilePaths: Record<string, boolean | undefined>,
): { visible: ModuleRelation[]; hidden: ModuleRelation[] } {
  const depsByPath = new Map<string, ModuleDependency[]>();

  buckets.forEach(aggregated => {
    const first = aggregated[0];
    if (first == null) {
      return;
    }
    const path = endpoint === 'target' ? first.target : first.source;
    const existing = depsByPath.get(path);
    if (existing) {
      existing.push(...aggregated);
      return;
    }
    depsByPath.set(path, [...aggregated]);
  });

  const visible: ModuleRelation[] = [];
  const hidden: ModuleRelation[] = [];

  depsByPath.forEach((aggregated, path) => {
    const flags = deriveRelationFlagsFromAggregated(aggregated);
    const leaf: ModuleRelation = {
      path,
      circular: flags.valueCircular,
      typeOnly: flags.typeOnly,
      typeOnlyCircular: flags.typeOnlyCircular,
    };
    (selectedFilePaths[path] ? visible : hidden).push(leaf);
  });

  return {
    visible: buildRelationPathTree(visible),
    hidden: buildRelationPathTree(hidden),
  };
}

/** Leave/enter relations for a file or folder path, split by selected vs hidden endpoints. */
export function getNodeRelations(
  path: string,
  snapshot: CruiseSnapshot,
  selectedFilePaths: Record<string, boolean | undefined>,
): ModuleRelations {
  const node = snapshot.nodes.get(path);
  if (node == null) {
    return EMPTY_RELATIONS;
  }

  const outgoing = splitExternalByVisibility(node.externalDependencies, 'target', selectedFilePaths);
  const incoming = splitExternalByVisibility(node.externalDependents, 'source', selectedFilePaths);

  return {
    dependencies: outgoing.visible,
    hiddenDependencies: outgoing.hidden,
    dependents: incoming.visible,
    hiddenDependents: incoming.hidden,
  };
}
