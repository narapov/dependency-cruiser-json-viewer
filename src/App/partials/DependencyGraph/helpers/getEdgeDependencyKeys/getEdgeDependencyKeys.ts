import type { IModule } from 'dependency-cruiser';

import type { Edge } from '@xyflow/react';

import { getEdgeHighlightColor, getVisibleRepresentative, makeDependencyKey } from '@/domain';

import type { PresenceRecord } from '../../types';

export { getEdgeHighlightColor, makeDependencyKey };

function presencePaths(record: PresenceRecord): string[] {
  return Object.entries(record)
    .filter(([, present]) => present)
    .map(([path]) => path);
}

/** All dependency keys between currently selected modules. */
export function collectValidDependencyKeys(modules: IModule[], selectedFilePaths: PresenceRecord): Set<string> {
  const selectedSet = new Set(presencePaths(selectedFilePaths));

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
  selectedFilePaths: PresenceRecord,
  expandedFolderPaths: PresenceRecord,
  visibleNodeIds: ReadonlySet<string>,
  sourceRep: string,
  targetRep: string,
): string[] {
  const selectedSet = new Set(presencePaths(selectedFilePaths));
  const expandedFolders = new Set(presencePaths(expandedFolderPaths));

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
  selectedFilePaths: PresenceRecord,
  expandedFolderPaths: PresenceRecord,
  visibleNodeIds: ReadonlySet<string>,
  edges: Edge[],
): Map<string, string[]> {
  return new Map(
    edges.map(edge => [
      edge.id,
      getEdgeDependencyKeys(modules, selectedFilePaths, expandedFolderPaths, visibleNodeIds, edge.source, edge.target),
    ]),
  );
}
