import type { CruiseSnapshot } from '../../../types';

export type RelatedModuleDirection = 'dependencies' | 'dependents';

/** Flat module source paths related to a file or folder node in one direction. */
export function collectRelatedModuleSources(
  snapshot: CruiseSnapshot,
  path: string,
  direction: RelatedModuleDirection,
): string[] {
  const node = snapshot.nodes.get(path);
  if (node == null) {
    return [];
  }

  const related = new Set<string>();
  if (direction === 'dependencies') {
    node.externalDependencies.forEach(aggregated => {
      aggregated.forEach(dep => {
        related.add(dep.target);
      });
    });
  } else {
    node.externalDependents.forEach(aggregated => {
      aggregated.forEach(dep => {
        related.add(dep.source);
      });
    });
  }

  return [...related];
}
