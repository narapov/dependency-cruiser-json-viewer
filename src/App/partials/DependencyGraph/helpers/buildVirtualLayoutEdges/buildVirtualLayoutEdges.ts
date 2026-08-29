import type { IModule } from 'dependency-cruiser';

import { getParentPath } from '@/domain';

/** Directed edge between sibling layout representatives. */
export interface LayoutEdge {
  source: string;
  target: string;
  /** Number of module dependencies collapsed into this sibling-level edge. */
  weight: number;
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

  return [
    ...modules
      .filter(module => selectedSet.has(module.source))
      .flatMap(module =>
        module.dependencies
          .filter(
            (dep): dep is typeof dep & { resolved: string } => Boolean(dep.resolved) && selectedSet.has(dep.resolved),
          )
          .map(dep => {
            const sourceChild = getDirectChildOfFolder(module.source, folderId);
            const targetChild = getDirectChildOfFolder(dep.resolved, folderId);
            return { sourceChild, targetChild };
          })
          .filter(
            ({ sourceChild, targetChild }) =>
              sourceChild !== targetChild && childSet.has(sourceChild) && childSet.has(targetChild),
          ),
      )
      .reduce((map, { sourceChild, targetChild }) => {
        const key = `${sourceChild}->${targetChild}`;
        const existing = map.get(key);
        if (existing) {
          existing.weight += 1;
        } else {
          map.set(key, { source: sourceChild, target: targetChild, weight: 1 });
        }
        return map;
      }, new Map<string, LayoutEdge>())
      .values(),
  ];
}
