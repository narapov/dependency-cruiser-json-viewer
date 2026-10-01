import type { DependencyEdgeAggregated, DependencyEdgeData } from '../../types';

/** Whether a path is this edge's endpoint or appears in aggregated file deps. */
export function isPathOnDependencyEdge(
  path: string,
  source: string,
  target: string,
  aggregated: readonly DependencyEdgeAggregated[] | undefined,
): 'source' | 'target' | null {
  if (path === source) {
    return 'source';
  }
  if (path === target) {
    return 'target';
  }
  if (aggregated?.some(dep => dep.source === path)) {
    return 'source';
  }
  if (aggregated?.some(dep => dep.target === path)) {
    return 'target';
  }
  return null;
}

/** Dependency keys carried by a visible edge for user highlights. */
export function getDependencyKeysFromEdgeData(data: DependencyEdgeData | undefined): string[] {
  return data?.aggregated?.map(dep => dep.id) ?? [];
}
