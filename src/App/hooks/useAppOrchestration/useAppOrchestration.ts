import { type RefObject } from 'react';

import {
  collectFolderPathsToCollapse,
  collectFolderPathsToExpand,
  collectRelatedModuleSources,
  collectViolationModulePaths,
  getCruiseSources,
  getCruiseSourcesUnder,
  isFileInSnapshot,
  isPathVisibleInSelectionRecord,
  resolveFolderNodes,
  serializeViewerWorkspace,
  type CruiseSnapshot,
  type RelatedModuleDirection,
  type ViewerWorkspaceSettings,
} from '@/domain';
import { APP_STORAGE_PREFIX, copyToClipboard, downloadTextFile } from '@/Shared';

import type { DependencyGraphHandle } from '../../partials/DependencyGraph';
import type { FileTreeHandle } from '../../partials/FileTree';
import {
  pathsToAbsenceRecord,
  pathsToPresenceRecord,
  presenceRecordToPaths,
  useWorkspaceStore,
} from '../../stores/workspaceStore';

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

function resolveActiveFolderPath(activePath: string | null, cruiseSnapshot: CruiseSnapshot): string | null {
  if (!activePath) {
    return null;
  }
  const node = cruiseSnapshot.nodes.get(activePath);
  if (!node) {
    return null;
  }
  if (node.isFolder) {
    return activePath;
  }
  return node.parent;
}

function getResolvedActivePath(): string | null {
  const { activePath, cruiseSnapshot } = useWorkspaceStore.getState();
  return activePath && cruiseSnapshot.nodes.has(activePath) ? activePath : null;
}

/**
 * Workspace action helpers for App. Reads live data via `getState()` so the hook
 * itself does not subscribe App to hot workspace fields.
 */
export function useAppOrchestration(config: UseAppOrchestrationOptions) {
  const { fileTreeRef, graphRef } = config;

  const expandFolderPaths = (paths: readonly string[]) => {
    if (paths.length === 0) {
      return;
    }
    useWorkspaceStore.getState().setExpandedFolderPaths(pathsToPresenceRecord(paths));
  };

  const collapseFolderPaths = (paths: readonly string[]) => {
    if (paths.length === 0) {
      return;
    }
    useWorkspaceStore.getState().setExpandedFolderPaths(pathsToAbsenceRecord(paths));
  };

  const activatePath = (path: string) => {
    const { setExpandedFolderPaths, setActivePath, cruiseSnapshot } = useWorkspaceStore.getState();
    const ancestors = cruiseSnapshot.nodes.get(path)?.ancestors ?? [];
    if (ancestors.length > 0) {
      setExpandedFolderPaths(pathsToPresenceRecord(ancestors));
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
    const { expandedFolderPaths, setExpandedFolderPaths } = useWorkspaceStore.getState();
    setExpandedFolderPaths({ [path]: !expandedFolderPaths[path] });
  };

  const expandFoldersToLevel = (paths: readonly string[], level: number) => {
    const { cruiseSnapshot } = useWorkspaceStore.getState();
    const folderNodes = resolveFolderNodes(cruiseSnapshot.nodes, paths);
    expandFolderPaths(collectFolderPathsToExpand(folderNodes, level));
  };

  const collapseFoldersToLevel = (paths: readonly string[], level: number) => {
    const { cruiseSnapshot } = useWorkspaceStore.getState();
    const folderNodes = resolveFolderNodes(cruiseSnapshot.nodes, paths);
    collapseFolderPaths(collectFolderPathsToCollapse(folderNodes, level));
  };

  const collapseFoldersRecursive = (paths: readonly string[]) => {
    const { cruiseSnapshot } = useWorkspaceStore.getState();
    const folderNodes = resolveFolderNodes(cruiseSnapshot.nodes, paths);
    collapseFolderPaths([...folderNodes.map(node => node.path), ...collectFolderPathsToCollapse(folderNodes, 1)]);
  };

  const expandRecursive = (path: string) => {
    expandFoldersToLevel([path], Infinity);
  };

  const collapseRecursive = (path: string) => {
    collapseFoldersRecursive([path]);
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
    const { selectedFilePaths, cruiseSnapshot } = useWorkspaceStore.getState();
    if (
      isPathVisibleInSelectionRecord(
        path,
        selectedFilePaths,
        cruiseSnapshot.nodes.get(path)?.descendantFiles ?? new Set(),
      )
    ) {
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

  const getActiveFolderPath = (): string | null => {
    const { cruiseSnapshot } = useWorkspaceStore.getState();
    return resolveActiveFolderPath(getResolvedActivePath(), cruiseSnapshot);
  };

  const expandActive = () => {
    const folderPath = getActiveFolderPath();
    if (!folderPath) {
      return;
    }
    expandFoldersToLevel([folderPath], 1);
  };

  const expandActiveRecursive = () => {
    const folderPath = getActiveFolderPath();
    if (!folderPath) {
      return;
    }
    expandRecursive(folderPath);
  };

  const expandActiveToLevel = (level: number) => {
    const folderPath = getActiveFolderPath();
    if (!folderPath) {
      return;
    }
    expandFoldersToLevel([folderPath], level);
  };

  const collapseActive = () => {
    const folderPath = getActiveFolderPath();
    if (!folderPath) {
      return;
    }
    collapseFolderPaths([folderPath]);
  };

  const collapseActiveRecursive = () => {
    const folderPath = getActiveFolderPath();
    if (!folderPath) {
      return;
    }
    collapseRecursive(folderPath);
  };

  const collapseActiveToLevel = (level: number) => {
    const folderPath = getActiveFolderPath();
    if (!folderPath) {
      return;
    }
    collapseFoldersToLevel([folderPath], level);
  };

  const getRootFolderPaths = (): string[] => {
    const { cruiseSnapshot } = useWorkspaceStore.getState();
    return cruiseSnapshot.tree
      .values()
      .filter(node => node.isFolder)
      .map(node => node.path)
      .toArray();
  };

  const expandRootsToLevel = (level: number) => {
    expandFoldersToLevel(getRootFolderPaths(), level);
  };

  const collapseRootsToLevel = (level: number) => {
    collapseFoldersToLevel(getRootFolderPaths(), level);
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

  const getCurrentWorkspaceSettings = (): ViewerWorkspaceSettings | null => {
    const state = useWorkspaceStore.getState();
    const { cruiseResult, ignorePatterns, cruiseSnapshot, folderBaseColors, userEdgeHighlights, graphSettings } = state;
    if (!cruiseResult) {
      return null;
    }
    const selectedPaths = presenceRecordToPaths(state.selectedFilePaths);
    const expandedKeys = presenceRecordToPaths(state.expandedFolderPaths);
    const resolvedDependenciesPath =
      state.dependenciesPanelPath && cruiseSnapshot.nodes.has(state.dependenciesPanelPath)
        ? state.dependenciesPanelPath
        : null;
    const resolvedApplicableRulesPath =
      state.applicableRulesPanelPath && cruiseSnapshot.nodes.has(state.applicableRulesPanelPath)
        ? state.applicableRulesPanelPath
        : null;
    const layout = graphRef.current?.getLayoutState() ?? {
      autoLayoutOnly: graphSettings.autoLayoutOnly,
      edgesType: graphSettings.edgesType,
      nodeLayouts: state.nodeLayouts ?? {},
    };
    return {
      ignorePatterns,
      selectedFiles: selectedPaths.filter(key => isFileInSnapshot(cruiseSnapshot, key)),
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
    expandFoldersToLevel(getRootFolderPaths(), Infinity);
  };

  const collapseAllRecursive = () => {
    useWorkspaceStore.getState().setExpandedFolderPaths({}, { replace: true });
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
    const { cruiseSnapshot } = useWorkspaceStore.getState();
    const filtered = paths.filter(path => isFileInSnapshot(cruiseSnapshot, path));
    setSelectedPaths(filtered);
    if (filtered.length > 0) {
      expandFolderPaths([...new Set(filtered.flatMap(path => cruiseSnapshot.nodes.get(path)?.ancestors ?? []))]);
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
    const { cruiseSnapshot, selectedFilePaths } = useWorkspaceStore.getState();
    const selectedPaths = presenceRecordToPaths(selectedFilePaths);
    const related = collectRelatedModuleSources(cruiseSnapshot, path, direction);
    const currentModuleSources = selectedPaths.filter(selected => isFileInSnapshot(cruiseSnapshot, selected));
    const nextSources = [...new Set([...currentModuleSources, ...sourcesForPath(path), ...related])];
    setSelectedPaths(nextSources);
    if (related.length > 0) {
      expandFolderPaths([
        ...new Set(related.flatMap(relatedPath => cruiseSnapshot.nodes.get(relatedPath)?.ancestors ?? [])),
      ]);
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
    showPathsOnly(getCruiseSources(cruiseSnapshot).filter(path => pathHasCircularDependency(cruiseSnapshot, path)));
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
      return dependenciesPanelPath && cruiseSnapshot.nodes.has(dependenciesPanelPath) ? dependenciesPanelPath : null;
    },
    get applicableRulesPath() {
      const { applicableRulesPanelPath, cruiseSnapshot } = useWorkspaceStore.getState();
      return applicableRulesPanelPath && cruiseSnapshot.nodes.has(applicableRulesPanelPath)
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
    expandActiveToLevel,
    getActiveFolderPath,
    collapseActive,
    collapseActiveRecursive,
    collapseActiveToLevel,
    collapseRecursive,
    clearAllHighlights,
    exportGraphDot,
    viewGraphDotOnline,
    saveWorkspace,
    getCurrentWorkspaceSettings,
    expandAllRecursive,
    collapseAllRecursive,
    getRootFolderPaths,
    expandRootsToLevel,
    collapseRootsToLevel,
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
