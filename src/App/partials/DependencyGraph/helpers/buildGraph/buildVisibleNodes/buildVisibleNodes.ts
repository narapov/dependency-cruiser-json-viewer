import { getParentPath, type CruiseTreeSnapshot } from '@/domain';

import type { FolderChildren } from '../../../types';

function buildChildrenIndex(snapshot: CruiseTreeSnapshot): Map<string, FolderChildren> {
  return new Map(
    [...snapshot.nodes.values()]
      .filter(node => node.isFolder)
      .map(node => {
        const folders: string[] = [];
        const files: string[] = [];
        node.childPaths.forEach(path => {
          if (snapshot.nodes.get(path)?.isFolder === true) {
            folders.push(path);
            return;
          }
          files.push(path);
        });
        return [node.path, { folders, files }] as const;
      }),
  );
}

function isFilePath(path: string, moduleSources: Set<string>): boolean {
  return moduleSources.has(path);
}

function hasSelectedDescendants(
  folderPath: string,
  selectedSet: Set<string>,
  childrenIndex: Map<string, FolderChildren>,
): boolean {
  if (selectedSet.has(folderPath)) {
    return true;
  }

  const children = childrenIndex.get(folderPath);
  if (!children) {
    return false;
  }

  return (
    children.files.some(file => selectedSet.has(file)) ||
    children.folders.some(subfolder => hasSelectedDescendants(subfolder, selectedSet, childrenIndex))
  );
}

function collectCircularModules(snapshot: CruiseTreeSnapshot): Set<string> {
  return new Set(
    snapshot.descendantFiles.filter(path => {
      const node = snapshot.nodes.get(path);
      return node?.dependencies.some(edge => edge.circular) === true;
    }),
  );
}

function collectUnresolvedModules(snapshot: CruiseTreeSnapshot): Set<string> {
  return new Set(snapshot.descendantFiles.filter(path => snapshot.nodes.get(path)?.module?.couldNotResolve === true));
}

/** Whether any selected circular module lives under this folder. */
export function folderHasCircularDescendant(
  folderPath: string,
  selectedSet: Set<string>,
  childrenIndex: Map<string, FolderChildren>,
  circularModules: Set<string>,
): boolean {
  const children = childrenIndex.get(folderPath);
  if (!children) {
    return false;
  }

  return (
    children.files.some(file => selectedSet.has(file) && circularModules.has(file)) ||
    children.folders.some(
      subfolder =>
        hasSelectedDescendants(subfolder, selectedSet, childrenIndex) &&
        folderHasCircularDescendant(subfolder, selectedSet, childrenIndex, circularModules),
    )
  );
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
  return [...new Set(selectedPaths.map(path => getEffectiveRoot(path, selectedSet, childrenIndex)))].sort();
}

function collectVisibleNodes(
  paths: string[],
  selectedSet: Set<string>,
  expandedFolders: Set<string>,
  moduleSources: Set<string>,
  childrenIndex: Map<string, FolderChildren>,
): Map<string, 'folder' | 'file'> {
  return paths
    .filter(path => selectedSet.has(path) || hasSelectedDescendants(path, selectedSet, childrenIndex))
    .reduce((visibleNodes, path) => {
      if (isFilePath(path, moduleSources)) {
        if (selectedSet.has(path)) {
          visibleNodes.set(path, 'file');
        }
        return visibleNodes;
      }

      visibleNodes.set(path, 'folder');

      if (!expandedFolders.has(path)) {
        return visibleNodes;
      }

      const children = childrenIndex.get(path);
      if (!children) {
        return visibleNodes;
      }

      const nested = collectVisibleNodes(
        children.folders.filter(subfolder => hasSelectedDescendants(subfolder, selectedSet, childrenIndex)),
        selectedSet,
        expandedFolders,
        moduleSources,
        childrenIndex,
      );

      [...nested.entries()].reduce((acc, [nestedPath, type]) => {
        acc.set(nestedPath, type);
        return acc;
      }, visibleNodes);

      return children.files
        .filter(file => selectedSet.has(file))
        .reduce((acc, file) => {
          acc.set(file, 'file');
          return acc;
        }, visibleNodes);
    }, new Map<string, 'folder' | 'file'>());
}

function buildParentByNode(
  visibleNodes: Map<string, 'folder' | 'file'>,
  expandedFolders: Set<string>,
): Map<string, string | null> {
  return new Map(
    [...visibleNodes.keys()].map(path => {
      const directParent = getParentPath(path);
      const parent =
        directParent && visibleNodes.has(directParent) && expandedFolders.has(directParent) ? directParent : null;
      return [path, parent] as const;
    }),
  );
}

/** Indexes and maps describing which nodes are visible for the current selection. */
export interface BuildVisibleNodesResult {
  selectedSet: Set<string>;
  childrenIndex: Map<string, FolderChildren>;
  circularModules: Set<string>;
  unresolvedModules: Set<string>;
  visibleNodes: Map<string, 'folder' | 'file'>;
  visibleNodeIds: Set<string>;
  parentByNode: Map<string, string | null>;
}

/** Collects visible file/folder nodes, circular modules, and parent links. */
export function buildVisibleNodes(
  snapshot: CruiseTreeSnapshot,
  selectedPaths: string[],
  expandedFolders: Set<string>,
): BuildVisibleNodesResult {
  const selectedSet = new Set(selectedPaths);
  const moduleSources = new Set(snapshot.descendantFiles);
  const childrenIndex = buildChildrenIndex(snapshot);
  const circularModules = collectCircularModules(snapshot);
  const unresolvedModules = collectUnresolvedModules(snapshot);

  const roots = getRootSelectedPaths(selectedPaths, selectedSet, childrenIndex);
  const visibleNodes = collectVisibleNodes(roots, selectedSet, expandedFolders, moduleSources, childrenIndex);

  const visibleNodeIds = new Set(visibleNodes.keys());
  const parentByNode = buildParentByNode(visibleNodes, expandedFolders);

  return {
    selectedSet,
    childrenIndex,
    circularModules,
    unresolvedModules,
    visibleNodes,
    visibleNodeIds,
    parentByNode,
  };
}
