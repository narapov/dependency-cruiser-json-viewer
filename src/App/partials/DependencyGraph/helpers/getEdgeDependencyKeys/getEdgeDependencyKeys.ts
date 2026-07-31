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

  return new Set(
    modules
      .filter(module => selectedSet.has(module.source))
      .flatMap(module =>
        module.dependencies
          .filter(
            (dep): dep is typeof dep & { resolved: string } => Boolean(dep.resolved) && selectedSet.has(dep.resolved),
          )
          .map(dep => makeDependencyKey(module.source, dep.resolved)),
      ),
  );
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

  return modules
    .filter(module => selectedSet.has(module.source))
    .flatMap(module =>
      module.dependencies
        .filter(
          (dep): dep is typeof dep & { resolved: string } => Boolean(dep.resolved) && selectedSet.has(dep.resolved),
        )
        .filter(dep => {
          const source = getVisibleRepresentative(module.source, selectedSet, expandedFolders, visibleNodeIds);
          const target = getVisibleRepresentative(dep.resolved, selectedSet, expandedFolders, visibleNodeIds);
          return source === sourceRep && target === targetRep;
        })
        .map(dep => makeDependencyKey(module.source, dep.resolved)),
    );
}

/** Maps each graph edge id to the module dependency keys it represents. */
export function buildEdgeDependencyKeyMap(
  modules: IModule[],
  selectedPaths: string[],
  expandedFolders: Set<string>,
  visibleNodeIds: ReadonlySet<string>,
  edges: Edge[],
): Map<string, string[]> {
  return new Map(
    edges.map(edge => [
      edge.id,
      getEdgeDependencyKeys(modules, selectedPaths, expandedFolders, visibleNodeIds, edge.source, edge.target),
    ]),
  );
}

/** Shared highlight color for dependency keys, or undefined if mixed or missing. */
export function getEdgeHighlightColor(
  dependencyKeys: readonly string[],
  userEdgeHighlights: ReadonlyMap<string, string>,
): string | undefined {
  if (dependencyKeys.length === 0) {
    return undefined;
  }

  const colors = dependencyKeys
    .map(key => userEdgeHighlights.get(key))
    .filter((color): color is string => color != null);

  if (colors.length === 0) {
    return undefined;
  }
  if (colors.every(color => color === colors[0])) {
    return colors[0];
  }
  return undefined;
}
