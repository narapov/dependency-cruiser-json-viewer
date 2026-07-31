import type { IModule } from 'dependency-cruiser';

import { getParentPath } from '@/domain';

/** Directed edge between sibling layout representatives. */
export interface LayoutEdge {
  source: string;
  target: string;
}

/** Nearest ancestor (or path itself) that is a direct child of the folder. */
export function getDirectChildOfFolder(path: string, folderId: string | null): string {
  let current = path;

  if (folderId === null) {
    let parent = getParentPath(current);
    while (parent !== null) {
      current = parent;
      parent = getParentPath(current);
    }
    return current;
  }

  let parent = getParentPath(current);
  while (parent !== null && parent !== folderId) {
    current = parent;
    parent = getParentPath(current);
  }
  return current;
}

/** Builds sibling-level layout edges from module dependencies within a folder. */
export function buildVirtualLayoutEdges(
  folderId: string | null,
  childIds: readonly string[],
  modules: readonly IModule[],
  selectedSet: Set<string>,
): LayoutEdge[] {
  const childSet = new Set(childIds);
  const edgeKeys = new Set<string>();
  const edges: LayoutEdge[] = [];

  for (const module of modules) {
    if (!selectedSet.has(module.source)) continue;

    for (const dep of module.dependencies) {
      const resolved = dep.resolved;
      if (!resolved || !selectedSet.has(resolved)) continue;

      const sourceChild = getDirectChildOfFolder(module.source, folderId);
      const targetChild = getDirectChildOfFolder(resolved, folderId);

      if (sourceChild === targetChild) continue;
      if (!childSet.has(sourceChild) || !childSet.has(targetChild)) continue;

      const key = `${sourceChild}->${targetChild}`;
      if (edgeKeys.has(key)) continue;
      edgeKeys.add(key);
      edges.push({ source: sourceChild, target: targetChild });
    }
  }

  return edges;
}
