import { useMemo, useState, type RefObject } from 'react';

import type { DependencyGraphHandle } from '../../../components/DependencyGraph';
import type { FileTreeHandle } from '../../../components/FileTree';
import { buildFileTree } from '../../../components/FileTree/helpers';
import { getAllFolderKeys, getAllKeys } from '../../../components/FileTree/helpers/treeIndex';
import {
  getAncestorKeys,
  getParentPath,
  getSubtreeFolderKeys,
  isPathVisibleInSelection,
  removeSubtreeFolderKeys,
  resolveActivePathAfterCollapse,
  toggleExpandedKey,
  type DependencyCruiserState,
} from '../../../domain';
import { APP_STORAGE_PREFIX, copyToClipboard } from '../../../Shared';

interface UseAppOrchestrationOptions {
  sources: string[];
  fileTreeRef: RefObject<FileTreeHandle | null>;
  graphRef: RefObject<DependencyGraphHandle | null>;
  initialDependencyCruiserState: DependencyCruiserState;
}

function isFolderPath(path: string, sources: string[]): boolean {
  return sources.some(source => source.startsWith(`${path}/`));
}

function isPathInSources(path: string, sources: string[]): boolean {
  if (sources.includes(path)) {
    return true;
  }
  return isFolderPath(path, sources);
}

function resolveActiveFolderPath(activePath: string | null, sources: string[]): string | null {
  if (activePath == null) return null;
  if (isFolderPath(activePath, sources)) return activePath;
  return getParentPath(activePath);
}

export function useAppOrchestration({
  sources,
  fileTreeRef,
  graphRef,
  initialDependencyCruiserState,
}: UseAppOrchestrationOptions) {
  const [selectedPaths, setSelectedPaths] = useState(initialDependencyCruiserState.selectedKeys);
  const [prevSelectedKeys, setPrevSelectedKeys] = useState(initialDependencyCruiserState.selectedKeys);
  const [expandedKeys, setExpandedKeys] = useState(initialDependencyCruiserState.expandedKeys);
  const [prevExpandedKeys, setPrevExpandedKeys] = useState(initialDependencyCruiserState.expandedKeys);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [dependenciesPath, setDependenciesPath] = useState<string | null>(null);

  if (initialDependencyCruiserState.selectedKeys !== prevSelectedKeys) {
    setPrevSelectedKeys(initialDependencyCruiserState.selectedKeys);
    setSelectedPaths(initialDependencyCruiserState.selectedKeys);
  }

  if (initialDependencyCruiserState.expandedKeys !== prevExpandedKeys) {
    setPrevExpandedKeys(initialDependencyCruiserState.expandedKeys);
    setExpandedKeys(initialDependencyCruiserState.expandedKeys);
  }

  const resolvedActivePath = activePath != null && isPathInSources(activePath, sources) ? activePath : null;
  const resolvedDependenciesPath =
    dependenciesPath != null && isPathInSources(dependenciesPath, sources) ? dependenciesPath : null;

  const treeData = useMemo(() => buildFileTree(sources), [sources]);
  const allKeys = useMemo(() => getAllKeys(treeData), [treeData]);
  const allFolderKeys = useMemo(() => getAllFolderKeys(treeData), [treeData]);

  const panelOpen = resolvedDependenciesPath != null;

  const updateExpandedKeys = (updater: string[] | ((prev: string[]) => string[])) => {
    setExpandedKeys(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const collapsed = prev.filter(key => !next.includes(key));
      if (collapsed.length > 0) {
        setActivePath(current => resolveActivePathAfterCollapse(current, collapsed));
      }
      return next;
    });
  };

  const activatePath = (path: string) => {
    const ancestors = getAncestorKeys(path);
    setExpandedKeys(keys => [...new Set([...keys, ...ancestors])]);
    setActivePath(path);
  };

  const showInGraph = (path: string) => {
    activatePath(path);
    graphRef.current?.focusNode(path);
  };

  const showInFileTree = (path: string) => {
    activatePath(path);
    fileTreeRef.current?.focusPath(path);
  };

  const toggleFolder = (path: string) => {
    updateExpandedKeys(keys => toggleExpandedKey(keys, path));
  };

  const expandRecursive = (path: string) => {
    updateExpandedKeys(keys => [...new Set([...keys, ...getSubtreeFolderKeys(path, sources)])]);
  };

  const handleShowDependencies = (path: string) => {
    setDependenciesPath(path);
  };

  const handleClosePanel = () => {
    setDependenciesPath(null);
  };

  const focusPath = (path: string) => {
    if (isPathVisibleInSelection(path, selectedPaths)) {
      graphRef.current?.focusNode(path);
    }
    fileTreeRef.current?.focusPath(path);
  };

  const handleQuickPickSelect = (path: string) => {
    activatePath(path);
    focusPath(path);
  };

  const focusActivePath = () => {
    if (resolvedActivePath == null) return;
    activatePath(resolvedActivePath);
    focusPath(resolvedActivePath);
  };

  const clearLocalStorage = () => {
    const keysToRemove: string[] = [];
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (key?.startsWith(`${APP_STORAGE_PREFIX}.`)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
    window.location.reload();
  };

  const copyActive = () => {
    if (resolvedActivePath == null) return;
    void copyToClipboard(resolvedActivePath);
  };

  const viewActiveDependencies = () => {
    if (resolvedActivePath == null) return;
    handleShowDependencies(resolvedActivePath);
  };

  const expandActive = () => {
    const folderPath = resolveActiveFolderPath(resolvedActivePath, sources);
    if (folderPath == null) return;
    updateExpandedKeys(keys => (keys.includes(folderPath) ? keys : [...keys, folderPath]));
  };

  const expandActiveRecursive = () => {
    const folderPath = resolveActiveFolderPath(resolvedActivePath, sources);
    if (folderPath == null) return;
    expandRecursive(folderPath);
  };

  const collapseActive = () => {
    const folderPath = resolveActiveFolderPath(resolvedActivePath, sources);
    if (folderPath == null) return;
    updateExpandedKeys(keys => (keys.includes(folderPath) ? keys.filter(key => key !== folderPath) : keys));
  };

  const collapseActiveRecursive = () => {
    const folderPath = resolveActiveFolderPath(resolvedActivePath, sources);
    if (folderPath == null) return;
    updateExpandedKeys(keys => removeSubtreeFolderKeys(keys, folderPath, sources));
  };

  const clearAllHighlights = () => {
    graphRef.current?.clearAllHighlights();
  };

  const expandAllRecursive = () => {
    updateExpandedKeys(allFolderKeys);
  };

  const collapseAllRecursive = () => {
    updateExpandedKeys([]);
  };

  const selectAll = () => {
    setSelectedPaths(allKeys);
  };

  const unselectAll = () => {
    setSelectedPaths([]);
  };

  return {
    panelOpen,
    selectedPaths,
    expandedKeys,
    activePath: resolvedActivePath,
    dependenciesPath: resolvedDependenciesPath,
    setSelectedPaths,
    updateExpandedKeys,
    activatePath,
    showInGraph,
    showInFileTree,
    toggleFolder,
    expandRecursive,
    handleShowDependencies,
    handleClosePanel,
    handleQuickPickSelect,
    focusActivePath,
    clearLocalStorage,
    copyActive,
    viewActiveDependencies,
    expandActive,
    expandActiveRecursive,
    collapseActive,
    collapseActiveRecursive,
    clearAllHighlights,
    expandAllRecursive,
    collapseAllRecursive,
    selectAll,
    unselectAll,
  };
}
