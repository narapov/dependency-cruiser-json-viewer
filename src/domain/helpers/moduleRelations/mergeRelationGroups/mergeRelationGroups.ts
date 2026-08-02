import type { IModule } from 'dependency-cruiser';

import type { ModuleRelation } from '../../../types';
import {
  createDependencyRelationFlags,
  finalizeDependencyRelationFlags,
  isTypeOnlyDependency,
  mergeDependencyRelationFlags,
  type DependencyRelationFlags,
} from '../../dependencyUtils';
import { getAncestorKeys } from '../../pathUtils';

type ModuleDep = IModule['dependencies'][number];

/** Collect all parent folder prefixes for the given source paths. */
export function buildFolderSet(sources: Iterable<string>): Set<string> {
  return new Set([...sources].flatMap(source => getAncestorKeys(source)));
}

/** Merge a dependency edge into a flat path → flags map. */
export function mergeRelation(map: Map<string, DependencyRelationFlags>, path: string, dep: ModuleDep): void {
  const isTypeOnly = isTypeOnlyDependency(dep);
  const isCircular = dep.circular === true;
  const existing = map.get(path);

  if (!existing) {
    map.set(path, createDependencyRelationFlags(isTypeOnly, isCircular));
    return;
  }

  mergeDependencyRelationFlags(existing, isTypeOnly, isCircular);
}

/** Convert a flags object into a finalized ModuleRelation row. */
function flagsToRelation(path: string, flags: DependencyRelationFlags): ModuleRelation {
  finalizeDependencyRelationFlags(flags);
  return {
    path,
    circular: flags.valueCircular,
    typeOnly: flags.typeOnly,
    typeOnlyCircular: flags.typeOnlyCircular,
  };
}

/** Build a sorted flat ModuleRelation list from a flags map. */
export function flagsMapToSortedRelations(map: Map<string, DependencyRelationFlags>): ModuleRelation[] {
  return [...map.entries()]
    .map(([path, flags]) => flagsToRelation(path, flags))
    .sort((a, b) => a.path.localeCompare(b.path));
}
