import type { IModule } from 'dependency-cruiser';

import type { Edge } from '@xyflow/react';

import { getVisibleRepresentative } from '@/domain';

/** Canonical `source->target` key for a module dependency. */
export function makeDependencyKey(source: string, target: string): string {
  return `${source}->${target}`;
}

/** All dependency keys between currently selected modules. */
export function collectValidDependencyKeys(modules: IModule[], selectedPaths: string[]): Set<string> {
  const selectedSet = new Set(selectedPaths);
  const keys = new Set<string>();

  for (const module of modules) {
    if (!selectedSet.has(module.source)) continue;

    for (const dep of module.dependencies) {
      const resolved = dep.resolved;
      if (!resolved || !selectedSet.has(resolved)) continue;
      keys.add(makeDependencyKey(module.source, resolved));
    }
  }

  return keys;
}

/** Module dependency keys that collapse onto a visible edge between representatives. */
export function getEdgeDependencyKeys(
  modules: IModule[],
  selectedPaths: string[],
  expandedFolders: Set<string>,
  visibleNodeIds: ReadonlySet<string>,
  sourceRep: string,
  targetRep: string,
): string[] {
  const selectedSet = new Set(selectedPaths);
  const keys: string[] = [];

  for (const module of modules) {
    if (!selectedSet.has(module.source)) continue;

    for (const dep of module.dependencies) {
      const resolved = dep.resolved;
      if (!resolved || !selectedSet.has(resolved)) continue;

      const source = getVisibleRepresentative(module.source, selectedSet, expandedFolders, visibleNodeIds);
      const target = getVisibleRepresentative(resolved, selectedSet, expandedFolders, visibleNodeIds);

      if (source === sourceRep && target === targetRep) {
        keys.push(makeDependencyKey(module.source, resolved));
      }
    }
  }

  return keys;
}

/** Maps each graph edge id to the module dependency keys it represents. */
export function buildEdgeDependencyKeyMap(
  modules: IModule[],
  selectedPaths: string[],
  expandedFolders: Set<string>,
  visibleNodeIds: ReadonlySet<string>,
  edges: Edge[],
): Map<string, string[]> {
  const map = new Map<string, string[]>();

  for (const edge of edges) {
    map.set(
      edge.id,
      getEdgeDependencyKeys(modules, selectedPaths, expandedFolders, visibleNodeIds, edge.source, edge.target),
    );
  }

  return map;
}

/** Shared highlight color for dependency keys, or undefined if mixed or missing. */
export function getEdgeHighlightColor(
  dependencyKeys: readonly string[],
  userEdgeHighlights: ReadonlyMap<string, string>,
): string | undefined {
  if (dependencyKeys.length === 0) return undefined;

  const colors = dependencyKeys
    .map(key => userEdgeHighlights.get(key))
    .filter((color): color is string => color != null);

  if (colors.length === 0) return undefined;
  if (colors.every(color => color === colors[0])) return colors[0];
  return undefined;
}
