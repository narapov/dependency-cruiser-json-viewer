import type { IModule } from 'dependency-cruiser';

import { getParentPath, isTypeOnlyDependency } from '@/domain';

import type { FolderChildren } from '../../types';

function buildChildrenIndex(sources: string[]): Map<string, FolderChildren> {
  const index = new Map<string, { folders: Set<string>; files: Set<string> }>();

  function ensure(folder: string) {
    if (!index.has(folder)) {
      index.set(folder, { folders: new Set(), files: new Set() });
    }
    return index.get(folder)!;
  }

  for (const source of sources) {
    const parts = source.split('/');
    for (let i = 0; i < parts.length - 1; i++) {
      const folder = parts.slice(0, i + 1).join('/');
      if (i + 1 === parts.length - 1) {
        ensure(folder).files.add(source);
      } else {
        const subfolder = parts.slice(0, i + 2).join('/');
        ensure(folder).folders.add(subfolder);
      }
    }
  }

  const result = new Map<string, FolderChildren>();
  for (const [folder, children] of index) {
    result.set(folder, {
      folders: [...children.folders].sort(),
      files: [...children.files].sort(),
    });
  }
  return result;
}

function isFilePath(path: string, moduleSources: Set<string>): boolean {
  return moduleSources.has(path);
}

function hasSelectedDescendants(
  folderPath: string,
  selectedSet: Set<string>,
  childrenIndex: Map<string, FolderChildren>,
): boolean {
  if (selectedSet.has(folderPath)) return true;

  const children = childrenIndex.get(folderPath);
  if (!children) return false;

  for (const file of children.files) {
    if (selectedSet.has(file)) return true;
  }
  for (const subfolder of children.folders) {
    if (hasSelectedDescendants(subfolder, selectedSet, childrenIndex)) return true;
  }
  return false;
}

function collectCircularModules(modules: IModule[]): Set<string> {
  const circularModules = new Set<string>();
  for (const module of modules) {
    if (!Array.isArray(module.dependencies)) continue;
    if (module.dependencies.some(dep => dep.circular === true && !isTypeOnlyDependency(dep))) {
      circularModules.add(module.source);
    }
  }
  return circularModules;
}

export function folderHasCircularDescendant(
  folderPath: string,
  selectedSet: Set<string>,
  childrenIndex: Map<string, FolderChildren>,
  circularModules: Set<string>,
): boolean {
  const children = childrenIndex.get(folderPath);
  if (!children) return false;

  for (const file of children.files) {
    if (selectedSet.has(file) && circularModules.has(file)) return true;
  }
  for (const subfolder of children.folders) {
    if (hasSelectedDescendants(subfolder, selectedSet, childrenIndex)) {
      if (folderHasCircularDescendant(subfolder, selectedSet, childrenIndex, circularModules)) {
        return true;
      }
    }
  }
  return false;
}

function getEffectiveRoot(path: string, selectedSet: Set<string>, childrenIndex: Map<string, FolderChildren>): string {
  let topmost = path;
  let current = path;
  let parent = getParentPath(current);

  while (parent && (selectedSet.has(parent) || hasSelectedDescendants(parent, selectedSet, childrenIndex))) {
    topmost = parent;
    current = parent;
    parent = getParentPath(current);
  }

  return topmost;
}

function getRootSelectedPaths(
  selectedPaths: string[],
  selectedSet: Set<string>,
  childrenIndex: Map<string, FolderChildren>,
): string[] {
  const roots = new Set<string>();
  for (const path of selectedPaths) {
    roots.add(getEffectiveRoot(path, selectedSet, childrenIndex));
  }
  return [...roots].sort();
}

function collectVisibleNodes(
  paths: string[],
  selectedSet: Set<string>,
  expandedFolders: Set<string>,
  moduleSources: Set<string>,
  childrenIndex: Map<string, FolderChildren>,
  visibleNodes: Map<string, 'folder' | 'file'>,
): void {
  for (const path of paths) {
    if (!selectedSet.has(path) && !hasSelectedDescendants(path, selectedSet, childrenIndex)) {
      continue;
    }

    if (isFilePath(path, moduleSources)) {
      if (selectedSet.has(path)) {
        visibleNodes.set(path, 'file');
      }
      continue;
    }

    visibleNodes.set(path, 'folder');

    if (!expandedFolders.has(path)) continue;

    const children = childrenIndex.get(path);
    if (!children) continue;

    for (const subfolder of children.folders) {
      if (hasSelectedDescendants(subfolder, selectedSet, childrenIndex)) {
        collectVisibleNodes([subfolder], selectedSet, expandedFolders, moduleSources, childrenIndex, visibleNodes);
      }
    }

    for (const file of children.files) {
      if (selectedSet.has(file)) {
        visibleNodes.set(file, 'file');
      }
    }
  }
}

function buildParentByNode(
  visibleNodes: Map<string, 'folder' | 'file'>,
  expandedFolders: Set<string>,
): Map<string, string | null> {
  const parentByNode = new Map<string, string | null>();

  for (const path of visibleNodes.keys()) {
    const directParent = getParentPath(path);
    if (directParent && visibleNodes.has(directParent) && expandedFolders.has(directParent)) {
      parentByNode.set(path, directParent);
    } else {
      parentByNode.set(path, null);
    }
  }

  return parentByNode;
}

export interface BuildVisibleNodesResult {
  selectedSet: Set<string>;
  childrenIndex: Map<string, FolderChildren>;
  circularModules: Set<string>;
  visibleNodes: Map<string, 'folder' | 'file'>;
  visibleNodeIds: Set<string>;
  parentByNode: Map<string, string | null>;
}

export function buildVisibleNodes(
  modules: readonly IModule[],
  selectedPaths: string[],
  expandedFolders: Set<string>,
): BuildVisibleNodesResult {
  const selectedSet = new Set(selectedPaths);
  const moduleSources = new Set(modules.map(m => m.source));
  const childrenIndex = buildChildrenIndex(modules.map(m => m.source));
  const circularModules = collectCircularModules([...modules]);

  const visibleNodes = new Map<string, 'folder' | 'file'>();
  const roots = getRootSelectedPaths(selectedPaths, selectedSet, childrenIndex);
  collectVisibleNodes(roots, selectedSet, expandedFolders, moduleSources, childrenIndex, visibleNodes);

  const visibleNodeIds = new Set(visibleNodes.keys());
  const parentByNode = buildParentByNode(visibleNodes, expandedFolders);

  return {
    selectedSet,
    childrenIndex,
    circularModules,
    visibleNodes,
    visibleNodeIds,
    parentByNode,
  };
}
