import { type RefObject } from 'react';

import {
  collectRelatedModuleSources,
  collectViolationModulePaths,
  getAncestorKeys,
  getCruiseSources,
  getCruiseSourcesUnder,
  getParentPath,
  getSubtreeFolderKeys,
  isPathInSources,
  isPathVisibleInSelection,
  removeSubtreeFolderKeys,
  serializeViewerWorkspace,
  toggleExpandedKey,
  type CruiseSnapshot,
  type RelatedModuleDirection,
  type ViewerWorkspaceSettings,
} from '@/domain';
import { APP_STORAGE_PREFIX, copyToClipboard, downloadTextFile } from '@/Shared';

import type { DependencyGraphHandle } from '../../partials/DependencyGraph';
import type { FileTreeHandle } from '../../partials/FileTree';
import { pathsToPresenceRecord, presenceRecordToPaths, useWorkspaceStore } from '../../stores/workspaceStore';

interface UseAppOrchestrationOptions {
  fileTreeRef: RefObject<FileTreeHandle | null>;
  graphRef: RefObject<DependencyGraphHandle | null>;
}

function pathHasCircularDependency(snapshot: CruiseSnapshot, path: string): boolean {
  const node = snapshot.nodes.get(path);
  if (!node) {
    return false;
  }
  const maps = [node.externalDependencies, node.internalDependencies, node.externalDependents, node.internalDependents];
  return maps.some(depMap => [...depMap.values()].some(aggregated => aggregated.some(dep => dep.circular)));
}

function resolveActiveFolderPath(activePath: string | null, isFolder: (path: string) => boolean): string | null {
  if (!activePath) {
    return null;
  }
  if (isFolder(activePath)) {
    return activePath;
  }
  return getParentPath(activePath);
}

function getResolvedActivePath(): string | null {
  const { activePath, cruiseSnapshot } = useWorkspaceStore.getState();
  const sources = getCruiseSources(cruiseSnapshot);
  return activePath && isPathInSources(activePath, sources) ? activePath : null;
}

/**
 * Workspace action helpers for App. Reads live data via `getState()` so the hook
 * itself does not subscribe App to hot workspace fields.
 */
export function useAppOrchestration(config: UseAppOrchestrationOptions) {
  const { fileTreeRef, graphRef } = config;

  const updateExpandedKeys = (updater: string[] | ((prev: string[]) => string[])) => {
    const { expandedFolderPaths, replaceExpandedFolderPaths } = useWorkspaceStore.getState();
    const previous = presenceRecordToPaths(expandedFolderPaths);
    const next = typeof updater === 'function' ? updater(previous) : updater;
    replaceExpandedFolderPaths(next);
  };

  const activatePath = (path: string) => {
    const { expandedFolderPaths, setExpandedFolderPaths, setActivePath } = useWorkspaceStore.getState();
    const ancestors = getAncestorKeys(path);
    const previous = presenceRecordToPaths(expandedFolderPaths);
    const next = [...new Set([...previous, ...ancestors])];
    if (next.length !== previous.length) {
      setExpandedFolderPaths(pathsToPresenceRecord(next));
    }
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
    const sources = getCruiseSources(useWorkspaceStore.getState().cruiseSnapshot);
    updateExpandedKeys(keys => [...new Set([...keys, ...getSubtreeFolderKeys(path, sources)])]);
  };

  const handleShowDependenciesPanel = (path: string) => {
    useWorkspaceStore.getState().setDependenciesPanelPath(path);
  };

  const handleClosePanel = () => {
    useWorkspaceStore.getState().setDependenciesPanelPath(null);
  };

  const handleShowApplicableRulesPanel = (path: string) => {
    useWorkspaceStore.getState().setApplicableRulesPanelPath(path);
  };

  const handleCloseApplicableRulesPanel = () => {
    useWorkspaceStore.getState().setApplicableRulesPanelPath(null);
  };

  const focusPath = (path: string) => {
    const selectedPaths = presenceRecordToPaths(useWorkspaceStore.getState().selectedFilePaths);
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
    const resolvedActivePath = getResolvedActivePath();
    if (!resolvedActivePath) {
      return;
    }
    activatePath(resolvedActivePath);
    focusPath(resolvedActivePath);
  };

  const clearLocalStorage = () => {
    Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
      .filter((key): key is string => key?.startsWith(`${APP_STORAGE_PREFIX}.`) === true)
      .forEach(key => {
        localStorage.removeItem(key);
      });
    window.location.reload();
  };

  const copyActive = () => {
    const resolvedActivePath = getResolvedActivePath();
    if (!resolvedActivePath) {
      return;
    }
    void copyToClipboard(resolvedActivePath);
  };

  const viewActiveItemDependenciesPanel = () => {
    const resolvedActivePath = getResolvedActivePath();
    if (!resolvedActivePath) {
      return;
    }
    handleShowDependenciesPanel(resolvedActivePath);
  };

  const viewActiveItemApplicableRulesPanel = () => {
    const resolvedActivePath = getResolvedActivePath();
    if (!resolvedActivePath) {
      return;
    }
    handleShowApplicableRulesPanel(resolvedActivePath);
  };

  const expandActive = () => {
    const { cruiseSnapshot } = useWorkspaceStore.getState();
    const folderPath = resolveActiveFolderPath(
      getResolvedActivePath(),
      path => cruiseSnapshot.nodes.get(path)?.isFolder === true,
    );
    if (!folderPath) {
      return;
    }
    updateExpandedKeys(keys => (keys.includes(folderPath) ? keys : [...keys, folderPath]));
  };

  const expandActiveRecursive = () => {
    const { cruiseSnapshot } = useWorkspaceStore.getState();
    const folderPath = resolveActiveFolderPath(
      getResolvedActivePath(),
      path => cruiseSnapshot.nodes.get(path)?.isFolder === true,
    );
    if (!folderPath) {
      return;
    }
    expandRecursive(folderPath);
  };

  const collapseActive = () => {
    const { cruiseSnapshot } = useWorkspaceStore.getState();
    const folderPath = resolveActiveFolderPath(
      getResolvedActivePath(),
      path => cruiseSnapshot.nodes.get(path)?.isFolder === true,
    );
    if (!folderPath) {
      return;
    }
    updateExpandedKeys(keys => (keys.includes(folderPath) ? keys.filter(key => key !== folderPath) : keys));
  };

  const collapseActiveRecursive = () => {
    const { cruiseSnapshot } = useWorkspaceStore.getState();
    const sources = getCruiseSources(cruiseSnapshot);
    const folderPath = resolveActiveFolderPath(
      getResolvedActivePath(),
      path => cruiseSnapshot.nodes.get(path)?.isFolder === true,
    );
    if (!folderPath) {
      return;
    }
    updateExpandedKeys(keys => removeSubtreeFolderKeys(keys, folderPath, sources));
  };

  const clearAllHighlights = () => {
    useWorkspaceStore.getState().clearAllHighlights();
  };

  const exportGraphDot = () => {
    graphRef.current?.exportDot();
  };

  const viewGraphDotOnline = () => {
    graphRef.current?.openDotOnline();
  };

  const openEdgesTypePicker = () => {
    graphRef.current?.openEdgesTypePicker();
  };

  const getCurrentWorkspaceSettings = (): ViewerWorkspaceSettings | null => {
    const state = useWorkspaceStore.getState();
    const { cruiseResult, ignorePatterns, cruiseSnapshot, folderBaseColors, userEdgeHighlights, graphSettings } = state;
    if (!cruiseResult) {
      return null;
    }
    const sources = getCruiseSources(cruiseSnapshot);
    const selectedPaths = presenceRecordToPaths(state.selectedFilePaths);
    const expandedKeys = presenceRecordToPaths(state.expandedFolderPaths);
    const resolvedDependenciesPath =
      state.dependenciesPanelPath && isPathInSources(state.dependenciesPanelPath, sources)
        ? state.dependenciesPanelPath
        : null;
    const resolvedApplicableRulesPath =
      state.applicableRulesPanelPath && isPathInSources(state.applicableRulesPanelPath, sources)
        ? state.applicableRulesPanelPath
        : null;
    const layout = graphRef.current?.getLayoutState() ?? {
      autoLayoutOnly: graphSettings.autoLayoutOnly,
      edgesType: graphSettings.edgesType,
      nodeLayouts: state.nodeLayouts ?? {},
    };
    return {
      ignorePatterns,
      selectedFiles: selectedPaths.filter(key => cruiseResult.modules.some(module => module.source === key)),
      expandedKeys,
      dependenciesPath: resolvedDependenciesPath,
      applicableRulesPath: resolvedApplicableRulesPath,
      userEdgeHighlights: Object.fromEntries(userEdgeHighlights.entries()),
      folderColors: folderBaseColors,
      autoLayoutOnly: layout.autoLayoutOnly,
      edgesType: layout.edgesType,
      nodePositions: {},
      nodeLayouts: layout.autoLayoutOnly ? {} : layout.nodeLayouts,
    };
  };

  const saveWorkspace = () => {
    const { cruiseResult } = useWorkspaceStore.getState();
    if (!cruiseResult) {
      return;
    }
    const settings = getCurrentWorkspaceSettings();
    if (!settings) {
      return;
    }
    const payload = serializeViewerWorkspace(cruiseResult, settings);
    downloadTextFile('cruise-result.json', `${JSON.stringify(payload, null, 2)}\n`, 'application/json');
  };

  const expandAllRecursive = () => {
    const folderKeys = [...useWorkspaceStore.getState().cruiseSnapshot.nodes.values()]
      .filter(node => node.isFolder)
      .map(node => node.path);
    updateExpandedKeys(folderKeys);
  };

  const collapseAllRecursive = () => {
    updateExpandedKeys([]);
  };

  const setSelectedPaths = (paths: string[]) => {
    useWorkspaceStore.getState().setSelectedFilePaths(pathsToPresenceRecord(paths));
  };

  const selectAll = () => {
    setSelectedPaths([...useWorkspaceStore.getState().cruiseSnapshot.nodes.keys()]);
  };

  const unselectAll = () => {
    setSelectedPaths([]);
  };

  const showPathsOnly = (paths: string[]) => {
    const sources = getCruiseSources(useWorkspaceStore.getState().cruiseSnapshot);
    const sourceSet = new Set(sources);
    const filtered = paths.filter(path => sourceSet.has(path));
    setSelectedPaths(filtered);
    if (filtered.length > 0) {
      updateExpandedKeys([...new Set(filtered.flatMap(getAncestorKeys))]);
    }
  };

  const sourcesForPath = (path: string): string[] =>
    getCruiseSourcesUnder(useWorkspaceStore.getState().cruiseSnapshot, path);

  const hideOthers = (path: string) => {
    const selectedPaths = presenceRecordToPaths(useWorkspaceStore.getState().selectedFilePaths);
    const kept = new Set(sourcesForPath(path)).intersection(new Set(selectedPaths));
    setSelectedPaths([...kept]);
  };

  const showRelatedModules = (path: string, direction: RelatedModuleDirection) => {
    const { cruiseSnapshot, selectedFilePaths, expandedFolderPaths } = useWorkspaceStore.getState();
    const sources = getCruiseSources(cruiseSnapshot);
    const selectedPaths = presenceRecordToPaths(selectedFilePaths);
    const expandedKeys = presenceRecordToPaths(expandedFolderPaths);
    const related = collectRelatedModuleSources(cruiseSnapshot, path, direction);
    const sourceSet = new Set(sources);
    const currentModuleSources = selectedPaths.filter(selected => sourceSet.has(selected));
    const nextSources = [...new Set([...currentModuleSources, ...sourcesForPath(path), ...related])];
    setSelectedPaths(nextSources);
    if (related.length > 0) {
      updateExpandedKeys([...new Set([...expandedKeys, ...related.flatMap(getAncestorKeys)])]);
    }
  };

  const showDirectDependencies = (path: string) => {
    showRelatedModules(path, 'dependencies');
  };

  const showDirectDependents = (path: string) => {
    showRelatedModules(path, 'dependents');
  };

  const showCircularDependenciesOnly = () => {
    const { cruiseSnapshot } = useWorkspaceStore.getState();
    const sources = getCruiseSources(cruiseSnapshot);
    showPathsOnly(sources.filter(path => pathHasCircularDependency(cruiseSnapshot, path)));
  };

  const showRuleViolationsOnly = (ruleNames: readonly string[]) => {
    const { cruiseResult, cruiseSnapshot } = useWorkspaceStore.getState();
    if (!cruiseResult) {
      return;
    }
    showPathsOnly(collectViolationModulePaths(cruiseSnapshot.violations, ruleNames));
  };

  const setUserDependencyHighlight = (dependencyKeys: readonly string[], color: string | null) => {
    useWorkspaceStore.getState().setUserDependencyHighlight(dependencyKeys, color);
  };

  const setUserEdgeHighlights = (
    userEdgeHighlights: ReturnType<typeof useWorkspaceStore.getState>['userEdgeHighlights'],
  ) => {
    useWorkspaceStore.getState().setUserEdgeHighlights(userEdgeHighlights);
  };

  return {
    get selectedPaths() {
      return presenceRecordToPaths(useWorkspaceStore.getState().selectedFilePaths);
    },
    get expandedKeys() {
      return presenceRecordToPaths(useWorkspaceStore.getState().expandedFolderPaths);
    },
    get activePath() {
      return getResolvedActivePath();
    },
    get dependenciesPath() {
      const { dependenciesPanelPath, cruiseSnapshot } = useWorkspaceStore.getState();
      const sources = getCruiseSources(cruiseSnapshot);
      return dependenciesPanelPath && isPathInSources(dependenciesPanelPath, sources) ? dependenciesPanelPath : null;
    },
    get applicableRulesPath() {
      const { applicableRulesPanelPath, cruiseSnapshot } = useWorkspaceStore.getState();
      const sources = getCruiseSources(cruiseSnapshot);
      return applicableRulesPanelPath && isPathInSources(applicableRulesPanelPath, sources)
        ? applicableRulesPanelPath
        : null;
    },
    get dependenciesPanelOpen() {
      return !!this.dependenciesPath;
    },
    get applicableRulesPanelOpen() {
      return !!this.applicableRulesPath;
    },
    get userEdgeHighlights() {
      return useWorkspaceStore.getState().userEdgeHighlights;
    },
    get folderBaseColors() {
      return useWorkspaceStore.getState().folderBaseColors;
    },
    setSelectedPaths,
    updateExpandedKeys,
    activatePath,
    showInGraph,
    showInFileTree,
    toggleFolder,
    expandRecursive,
    handleShowDependenciesPanel,
    handleClosePanel,
    handleShowApplicableRulesPanel,
    handleCloseApplicableRulesPanel,
    handleQuickPickSelect,
    focusActivePath,
    clearLocalStorage,
    copyActive,
    viewActiveItemDependenciesPanel,
    viewActiveItemApplicableRulesPanel,
    expandActive,
    expandActiveRecursive,
    collapseActive,
    collapseActiveRecursive,
    clearAllHighlights,
    exportGraphDot,
    viewGraphDotOnline,
    openEdgesTypePicker,
    saveWorkspace,
    getCurrentWorkspaceSettings,
    expandAllRecursive,
    collapseAllRecursive,
    selectAll,
    unselectAll,
    showPathsOnly,
    hideOthers,
    showDirectDependencies,
    showDirectDependents,
    showCircularDependenciesOnly,
    showRuleViolationsOnly,
    setUserDependencyHighlight,
    setUserEdgeHighlights,
  };
}
