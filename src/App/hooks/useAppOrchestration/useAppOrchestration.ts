import { type RefObject } from 'react';

import {
  collectRelatedModuleSources,
  collectViolationModulePaths,
  getAncestorKeys,
  getCruiseModules,
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

import type { DependencyGraphHandle, GraphLayoutState } from '../../partials/DependencyGraph';
import type { FileTreeHandle } from '../../partials/FileTree';
import { pathsToPresenceRecord, presenceRecordToPaths, useWorkspaceStore } from '../../stores/workspaceStore';

interface UseAppOrchestrationOptions {
  fileTreeRef: RefObject<FileTreeHandle | null>;
  graphRef: RefObject<DependencyGraphHandle | null>;
}

function pathHasCircularDependency(snapshot: CruiseSnapshot, path: string): boolean {
  const node = snapshot.nodes.get(path);
  if (node == null) {
    return false;
  }
  const maps = [node.externalDependencies, node.internalDependencies, node.externalDependents, node.internalDependents];
  return maps.some(depMap => [...depMap.values()].some(aggregated => aggregated.some(dep => dep.circular)));
}

function toGraphNodePositions(
  nodePositions: Record<string, Record<string, { x: number; y: number } | undefined>> | null,
): GraphLayoutState['nodePositions'] {
  if (nodePositions == null) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(nodePositions).map(([groupId, children]) => [
      groupId,
      Object.fromEntries(
        Object.entries(children).filter((entry): entry is [string, { x: number; y: number }] => entry[1] != null),
      ),
    ]),
  );
}

function resolveActiveFolderPath(activePath: string | null, isFolder: (path: string) => boolean): string | null {
  if (activePath == null) {
    return null;
  }
  if (isFolder(activePath)) {
    return activePath;
  }
  return getParentPath(activePath);
}

export function useAppOrchestration(config: UseAppOrchestrationOptions) {
  const { fileTreeRef, graphRef } = config;

  const cruiseResult = useWorkspaceStore(state => state.cruiseResult);
  const ignorePatterns = useWorkspaceStore(state => state.ignorePatterns);
  const cruiseSnapshot = useWorkspaceStore(state => state.cruiseSnapshot);
  const selectedFilePaths = useWorkspaceStore(state => state.selectedFilePaths);
  const expandedFolderPaths = useWorkspaceStore(state => state.expandedFolderPaths);
  const activePath = useWorkspaceStore(state => state.activePath);
  const dependenciesPanelPath = useWorkspaceStore(state => state.dependenciesPanelPath);
  const applicableRulesPanelPath = useWorkspaceStore(state => state.applicableRulesPanelPath);
  const userEdgeHighlights = useWorkspaceStore(state => state.userEdgeHighlights);
  const folderBaseColors = useWorkspaceStore(state => state.folderBaseColors);
  const graphSettings = useWorkspaceStore(state => state.graphSettings);
  const nodePositions = useWorkspaceStore(state => state.nodePositions);

  const setSelectedFilePaths = useWorkspaceStore(state => state.setSelectedFilePaths);
  const setExpandedFolderPaths = useWorkspaceStore(state => state.setExpandedFolderPaths);
  const replaceExpandedFolderPaths = useWorkspaceStore(state => state.replaceExpandedFolderPaths);
  const setActivePath = useWorkspaceStore(state => state.setActivePath);
  const setDependenciesPanelPath = useWorkspaceStore(state => state.setDependenciesPanelPath);
  const setApplicableRulesPanelPath = useWorkspaceStore(state => state.setApplicableRulesPanelPath);
  const setUserEdgeHighlights = useWorkspaceStore(state => state.setUserEdgeHighlights);
  const setUserDependencyHighlight = useWorkspaceStore(state => state.setUserDependencyHighlight);
  const clearAllHighlightsAction = useWorkspaceStore(state => state.clearAllHighlights);

  const sources = getCruiseSources(cruiseSnapshot);
  const selectedPaths = presenceRecordToPaths(selectedFilePaths);
  const expandedKeys = presenceRecordToPaths(expandedFolderPaths);

  const resolvedActivePath = activePath != null && isPathInSources(activePath, sources) ? activePath : null;
  const resolvedDependenciesPath =
    dependenciesPanelPath != null && isPathInSources(dependenciesPanelPath, sources) ? dependenciesPanelPath : null;
  const resolvedApplicableRulesPath =
    applicableRulesPanelPath != null && isPathInSources(applicableRulesPanelPath, sources)
      ? applicableRulesPanelPath
      : null;

  const dependenciesPanelOpen = resolvedDependenciesPath != null;
  const applicableRulesPanelOpen = resolvedApplicableRulesPath != null;

  const updateExpandedKeys = (updater: string[] | ((prev: string[]) => string[])) => {
    const previous = presenceRecordToPaths(useWorkspaceStore.getState().expandedFolderPaths);
    const next = typeof updater === 'function' ? updater(previous) : updater;
    replaceExpandedFolderPaths(next);
  };

  const activatePath = (path: string) => {
    const ancestors = getAncestorKeys(path);
    const previous = presenceRecordToPaths(useWorkspaceStore.getState().expandedFolderPaths);
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
    updateExpandedKeys(keys => [...new Set([...keys, ...getSubtreeFolderKeys(path, sources)])]);
  };

  const handleShowDependenciesPanel = (path: string) => {
    setDependenciesPanelPath(path);
  };

  const handleClosePanel = () => {
    setDependenciesPanelPath(null);
  };

  const handleShowApplicableRulesPanel = (path: string) => {
    setApplicableRulesPanelPath(path);
  };

  const handleCloseApplicableRulesPanel = () => {
    setApplicableRulesPanelPath(null);
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
    if (resolvedActivePath == null) {
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
    if (resolvedActivePath == null) {
      return;
    }
    void copyToClipboard(resolvedActivePath);
  };

  const viewActiveItemDependenciesPanel = () => {
    if (resolvedActivePath == null) {
      return;
    }
    handleShowDependenciesPanel(resolvedActivePath);
  };

  const viewActiveItemApplicableRulesPanel = () => {
    if (resolvedActivePath == null) {
      return;
    }
    handleShowApplicableRulesPanel(resolvedActivePath);
  };

  const expandActive = () => {
    const folderPath = resolveActiveFolderPath(
      resolvedActivePath,
      path => cruiseSnapshot.nodes.get(path)?.isFolder === true,
    );
    if (folderPath == null) {
      return;
    }
    updateExpandedKeys(keys => (keys.includes(folderPath) ? keys : [...keys, folderPath]));
  };

  const expandActiveRecursive = () => {
    const folderPath = resolveActiveFolderPath(
      resolvedActivePath,
      path => cruiseSnapshot.nodes.get(path)?.isFolder === true,
    );
    if (folderPath == null) {
      return;
    }
    expandRecursive(folderPath);
  };

  const collapseActive = () => {
    const folderPath = resolveActiveFolderPath(
      resolvedActivePath,
      path => cruiseSnapshot.nodes.get(path)?.isFolder === true,
    );
    if (folderPath == null) {
      return;
    }
    updateExpandedKeys(keys => (keys.includes(folderPath) ? keys.filter(key => key !== folderPath) : keys));
  };

  const collapseActiveRecursive = () => {
    const folderPath = resolveActiveFolderPath(
      resolvedActivePath,
      path => cruiseSnapshot.nodes.get(path)?.isFolder === true,
    );
    if (folderPath == null) {
      return;
    }
    updateExpandedKeys(keys => removeSubtreeFolderKeys(keys, folderPath, sources));
  };

  const clearAllHighlights = () => {
    clearAllHighlightsAction();
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
    if (cruiseResult == null) {
      return null;
    }
    const layout = graphRef.current?.getLayoutState() ?? {
      autoLayoutOnly: graphSettings.autoLayoutOnly,
      edgesType: graphSettings.edgesType,
      nodePositions: toGraphNodePositions(nodePositions),
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
      nodePositions: layout.autoLayoutOnly ? {} : layout.nodePositions,
    };
  };

  const saveWorkspace = () => {
    if (cruiseResult == null) {
      return;
    }
    const settings = getCurrentWorkspaceSettings();
    if (settings == null) {
      return;
    }
    const payload = serializeViewerWorkspace(cruiseResult, settings);
    downloadTextFile('cruise-result.json', `${JSON.stringify(payload, null, 2)}\n`, 'application/json');
  };

  const expandAllRecursive = () => {
    const folderKeys = [...cruiseSnapshot.nodes.values()].filter(node => node.isFolder).map(node => node.path);
    updateExpandedKeys(folderKeys);
  };

  const collapseAllRecursive = () => {
    updateExpandedKeys([]);
  };

  const setSelectedPaths = (paths: string[]) => {
    setSelectedFilePaths(pathsToPresenceRecord(paths));
  };

  const selectAll = () => {
    setSelectedPaths([...cruiseSnapshot.nodes.keys()]);
  };

  const unselectAll = () => {
    setSelectedPaths([]);
  };

  const showPathsOnly = (paths: string[]) => {
    const sourceSet = new Set(sources);
    const filtered = paths.filter(path => sourceSet.has(path));
    setSelectedPaths(filtered);
    if (filtered.length > 0) {
      updateExpandedKeys([...new Set(filtered.flatMap(getAncestorKeys))]);
    }
  };

  const sourcesForPath = (path: string): string[] => getCruiseSourcesUnder(cruiseSnapshot, path);

  const hideOthers = (path: string) => {
    const kept = new Set(sourcesForPath(path)).intersection(new Set(selectedPaths));
    setSelectedPaths([...kept]);
  };

  const showRelatedModules = (path: string, direction: RelatedModuleDirection) => {
    const related = collectRelatedModuleSources(path, getCruiseModules(cruiseSnapshot), direction);
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
    showPathsOnly(sources.filter(path => pathHasCircularDependency(cruiseSnapshot, path)));
  };

  const showRuleViolationsOnly = (ruleNames: readonly string[]) => {
    if (cruiseResult == null) {
      return;
    }
    showPathsOnly(collectViolationModulePaths(cruiseResult.summary.violations, ruleNames, sources));
  };

  return {
    dependenciesPanelOpen,
    applicableRulesPanelOpen,
    selectedPaths,
    expandedKeys,
    activePath: resolvedActivePath,
    dependenciesPath: resolvedDependenciesPath,
    applicableRulesPath: resolvedApplicableRulesPath,
    userEdgeHighlights,
    folderBaseColors,
    setUserEdgeHighlights,
    setUserDependencyHighlight,
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
  };
}
