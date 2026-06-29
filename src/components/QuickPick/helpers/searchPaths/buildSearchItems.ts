import { getBaseName, getParentPath } from '../../../../domain';
import type { QuickPickFileItem } from '../../types';

const ROOT_KEY = '';

function isFolderPath(path: string, sources: string[]): boolean {
  return sources.some(source => source.startsWith(`${path}/`));
}

function collectPaths(sources: string[]): Set<string> {
  const paths = new Set<string>();

  for (const source of sources) {
    paths.add(source);
    let current = source;
    while (true) {
      const parent = getParentPath(current);
      if (!parent) break;
      paths.add(parent);
      current = parent;
    }
  }

  return paths;
}

export function buildSearchItems(sources: string[]): QuickPickFileItem[] {
  const pathSet = collectPaths(sources);
  const childrenByParent = new Map<string, string[]>();

  for (const path of pathSet) {
    const parent = getParentPath(path);
    const parentKey = parent && pathSet.has(parent) ? parent : ROOT_KEY;
    const siblings = childrenByParent.get(parentKey) ?? [];
    siblings.push(path);
    childrenByParent.set(parentKey, siblings);
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort((a, b) => {
      const aIsFolder = isFolderPath(a, sources);
      const bIsFolder = isFolderPath(b, sources);
      if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1;
      return getBaseName(a).localeCompare(getBaseName(b));
    });
  }

  const items: QuickPickFileItem[] = [];

  function walk(parentKey: string) {
    for (const path of childrenByParent.get(parentKey) ?? []) {
      items.push({
        key: path,
        name: getBaseName(path),
        isFolder: isFolderPath(path, sources),
      });
      if (isFolderPath(path, sources)) {
        walk(path);
      }
    }
  }

  walk(ROOT_KEY);
  return items;
}
