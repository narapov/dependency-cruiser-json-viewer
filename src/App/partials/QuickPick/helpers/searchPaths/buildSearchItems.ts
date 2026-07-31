import { getAncestorKeys, getBaseName, getParentPath } from '@/domain';

import type { QuickPickFileItem } from '../../types';

const ROOT_KEY = '';

function isFolderPath(path: string, sources: string[]): boolean {
  return sources.some(source => source.startsWith(`${path}/`));
}

function collectPaths(sources: string[]): Set<string> {
  return new Set(sources.flatMap(source => [source, ...getAncestorKeys(source)]));
}

function buildChildrenByParent(pathSet: Set<string>): Map<string, string[]> {
  return [...pathSet].reduce((childrenByParent, path) => {
    const parent = getParentPath(path);
    const parentKey = parent && pathSet.has(parent) ? parent : ROOT_KEY;
    const siblings = childrenByParent.get(parentKey) ?? [];
    return childrenByParent.set(parentKey, [...siblings, path]);
  }, new Map<string, string[]>());
}

function sortSiblings(siblings: string[], sources: string[]): string[] {
  return [...siblings].sort((a, b) => {
    const aIsFolder = isFolderPath(a, sources);
    const bIsFolder = isFolderPath(b, sources);
    if (aIsFolder !== bIsFolder) {
      return aIsFolder ? -1 : 1;
    }
    return getBaseName(a).localeCompare(getBaseName(b));
  });
}

function walkItems(parentKey: string, childrenByParent: Map<string, string[]>, sources: string[]): QuickPickFileItem[] {
  return (childrenByParent.get(parentKey) ?? []).flatMap(path => {
    const isFolder = isFolderPath(path, sources);
    const item: QuickPickFileItem = {
      key: path,
      name: getBaseName(path),
      isFolder,
    };
    return isFolder ? [item, ...walkItems(path, childrenByParent, sources)] : [item];
  });
}

/** Builds sorted file and folder quick-pick items from source paths. */
export function buildSearchItems(sources: string[]): QuickPickFileItem[] {
  const pathSet = collectPaths(sources);
  const childrenByParent = [...buildChildrenByParent(pathSet).entries()].reduce(
    (acc, [parentKey, siblings]) => acc.set(parentKey, sortSiblings(siblings, sources)),
    new Map<string, string[]>(),
  );

  return walkItems(ROOT_KEY, childrenByParent, sources);
}
