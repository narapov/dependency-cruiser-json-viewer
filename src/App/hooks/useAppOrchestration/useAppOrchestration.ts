import { useEffect, useMemo, useReducer, type RefObject } from 'react';

import {
  applyHighlightKeys,
  collectCircularModulePaths,
  collectRelatedModuleSources,
  collectSourcesUnderFolder,
  expandSelectionWithSelectedAncestors,
  filterCruiseResult,
  getAncestorKeys,
  getParentPath,
  getSubtreeFolderKeys,
  isFolderPath,
  isPathInSources,
  isPathVisibleInSelection,
  removeSubtreeFolderKeys,
  resolveActivePathAfterCollapse,
  serializeViewerWorkspace,
  toggleExpandedKey,
  type DependencyCruiserState,
  type FolderBaseColor,
  type MergedViewerWorkspaceView,
  type RelatedModuleDirection,
  type ViewerWorkspaceSettings,
} from '@/domain';
import { APP_STORAGE_PREFIX, copyToClipboard, downloadTextFile } from '@/Shared';

import { defaultFolderColorsRecord } from '../../helpers';
import type { DependencyGraphHandle, GraphLayoutState } from '../../partials/DependencyGraph';
import { buildFileTree, getAllFolderKeys, getAllKeys, type FileTreeHandle } from '../../partials/FileTree';

interface UseAppOrchestrationOptions {
  sources: string[];
  unfilteredCruiseResult: import('dependency-cruiser').ICruiseResult | undefined;
  ignorePatterns: string[];
  fileTreeRef: RefObject<FileTreeHandle | null>;
  graphRef: RefObject<DependencyGraphHandle | null>;
  initialDependencyCruiserState: DependencyCruiserState;
  cruiseLoadId: number;
}

interface WorkspaceViewState {
  selectedPaths: string[];
  expandedKeys: string[];
  activePath: string | null;
  dependenciesPath: string | null;
  userEdgeHighlights: ReadonlyMap<string, string>;
  folderBaseColors: Record<string, FolderBaseColor>;
  pendingLayout: GraphLayoutState | null;
  sourcesKey: string;
  cruiseLoadId: number;
  lastInitialSelectedKeys: string[];
  lastInitialExpandedKeys: string[];
}

type WorkspaceViewAction =
  | {
      type: 'syncFromProps';
      sources: string[];
      sourcesKey: string;
      cruiseLoadId: number;
      initial: DependencyCruiserState;
    }
  | {
      type: 'applyWorkspaceView';
      view: MergedViewerWorkspaceView;
      sourcesKey: string;
      cruiseLoadId: number;
      lastInitialSelectedKeys: string[];
      lastInitialExpandedKeys: string[];
    }
  | { type: 'toggleFolder'; path: string }
  | { type: 'expandRecursive'; path: string; sources: string[] }
  | { type: 'updateExpandedKeys'; updater: string[] | ((prev: string[]) => string[]) }
  | { type: 'activatePath'; path: string }
  | { type: 'setSelectedPaths'; paths: string[] }
  | { type: 'setDependenciesPath'; path: string | null }
  | { type: 'setUserEdgeHighlights'; highlights: ReadonlyMap<string, string> }
  | { type: 'setUserDependencyHighlight'; keys: readonly string[]; color: string | null }
  | { type: 'clearAllHighlights' }
  | { type: 'layoutApplied' };

function resolveActiveFolderPath(activePath: string | null, sources: string[]): string | null {
  if (activePath == null) {
    return null;
  }
  if (isFolderPath(activePath, sources)) {
    return activePath;
  }
  return getParentPath(activePath);
}

function createInitialWorkspaceViewState(
  sources: string[],
  cruiseLoadId: number,
  initial: DependencyCruiserState,
): WorkspaceViewState {
  return {
    selectedPaths: initial.selectedKeys,
    expandedKeys: initial.expandedKeys,
    activePath: null,
    dependenciesPath: null,
    userEdgeHighlights: new Map(),
    folderBaseColors: defaultFolderColorsRecord(sources),
    pendingLayout: null,
    sourcesKey: sources.join('\0'),
    cruiseLoadId,
    lastInitialSelectedKeys: initial.selectedKeys,
    lastInitialExpandedKeys: initial.expandedKeys,
  };
}

function syncWorkspaceViewFromProps(
  state: WorkspaceViewState,
  action: Extract<WorkspaceViewAction, { type: 'syncFromProps' }>,
): WorkspaceViewState {
  const { sources, sourcesKey, cruiseLoadId, initial } = action;

  if (sourcesKey !== state.sourcesKey || cruiseLoadId !== state.cruiseLoadId) {
    return {
      selectedPaths: initial.selectedKeys,
      expandedKeys: initial.expandedKeys,
      activePath: null,
      dependenciesPath: null,
      userEdgeHighlights: new Map(),
      folderBaseColors: defaultFolderColorsRecord(sources),
      pendingLayout: { autoLayoutOnly: true, nodePositions: {} },
      sourcesKey,
      cruiseLoadId,
      lastInitialSelectedKeys: initial.selectedKeys,
      lastInitialExpandedKeys: initial.expandedKeys,
    };
  }

  // Adopt new initial identity after eager apply (resolve vs useMemo create distinct arrays)
  // without clobbering the applied view. Selection sync on sources/cruiseLoadId is above.
  if (
    initial.selectedKeys !== state.lastInitialSelectedKeys ||
    initial.expandedKeys !== state.lastInitialExpandedKeys
  ) {
    return {
      ...state,
      lastInitialSelectedKeys: initial.selectedKeys,
      lastInitialExpandedKeys: initial.expandedKeys,
    };
  }

  return state;
}

function sourcesFromSourcesKey(sourcesKey: string): string[] {
  return sourcesKey === '' ? [] : sourcesKey.split('\0');
}

function applyWorkspaceViewState(
  state: WorkspaceViewState,
  action: Extract<WorkspaceViewAction, { type: 'applyWorkspaceView' }>,
): WorkspaceViewState {
  const { view, sourcesKey, cruiseLoadId, lastInitialSelectedKeys, lastInitialExpandedKeys } = action;
  return {
    ...state,
    selectedPaths: expandSelectionWithSelectedAncestors(view.selectedFiles, sourcesFromSourcesKey(sourcesKey)),
    expandedKeys: view.expandedKeys,
    dependenciesPath: view.dependenciesPath,
    userEdgeHighlights: view.userEdgeHighlights,
    folderBaseColors: view.folderColors,
    activePath: null,
    pendingLayout: {
      autoLayoutOnly: view.autoLayoutOnly,
      nodePositions: view.nodePositions,
    },
    sourcesKey,
    cruiseLoadId,
    lastInitialSelectedKeys,
    lastInitialExpandedKeys,
  };
}

function updateExpandedKeysState(
  state: WorkspaceViewState,
  updater: string[] | ((prev: string[]) => string[]),
): WorkspaceViewState {
  const next = typeof updater === 'function' ? updater(state.expandedKeys) : updater;
  const collapsed = state.expandedKeys.filter(key => !next.includes(key));
  if (collapsed.length === 0 && next === state.expandedKeys) {
    return state;
  }
  return {
    ...state,
    expandedKeys: next,
    activePath: collapsed.length > 0 ? resolveActivePathAfterCollapse(state.activePath, collapsed) : state.activePath,
  };
}

function workspaceViewReducer(state: WorkspaceViewState, action: WorkspaceViewAction): WorkspaceViewState {
  switch (action.type) {
    case 'syncFromProps':
      return syncWorkspaceViewFromProps(state, action);

    case 'applyWorkspaceView':
      return applyWorkspaceViewState(state, action);

    case 'toggleFolder':
      return updateExpandedKeysState(state, keys => toggleExpandedKey(keys, action.path));

    case 'expandRecursive':
      return updateExpandedKeysState(state, keys => [
        ...new Set([...keys, ...getSubtreeFolderKeys(action.path, action.sources)]),
      ]);

    case 'updateExpandedKeys':
      return updateExpandedKeysState(state, action.updater);

    case 'activatePath': {
      const ancestors = getAncestorKeys(action.path);
      const oldKeysSet = new Set(state.expandedKeys);
      const newKeysSet = new Set([...state.expandedKeys, ...ancestors]);
      const expandedKeys = oldKeysSet.size !== newKeysSet.size ? Array.from(newKeysSet) : state.expandedKeys;
      return {
        ...state,
        expandedKeys,
        activePath: action.path,
      };
    }

    case 'setSelectedPaths':
      return { ...state, selectedPaths: action.paths };

    case 'setDependenciesPath':
      return { ...state, dependenciesPath: action.path };

    case 'setUserEdgeHighlights':
      return { ...state, userEdgeHighlights: action.highlights };

    case 'setUserDependencyHighlight':
      return {
        ...state,
        userEdgeHighlights: applyHighlightKeys(state.userEdgeHighlights, action.keys, action.color),
      };

    case 'clearAllHighlights':
      return { ...state, userEdgeHighlights: new Map() };

    case 'layoutApplied':
      return state.pendingLayout == null ? state : { ...state, pendingLayout: null };

    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

export function useAppOrchestration({
  sources,
  unfilteredCruiseResult,
  ignorePatterns,
  fileTreeRef,
  graphRef,
  initialDependencyCruiserState,
  cruiseLoadId,
}: UseAppOrchestrationOptions) {
  const [state, dispatch] = useReducer(workspaceViewReducer, undefined, () =>
    createInitialWorkspaceViewState(sources, cruiseLoadId, initialDependencyCruiserState),
  );

  const sourcesKey = sources.join('\0');

  if (
    sourcesKey !== state.sourcesKey ||
    cruiseLoadId !== state.cruiseLoadId ||
    initialDependencyCruiserState.selectedKeys !== state.lastInitialSelectedKeys ||
    initialDependencyCruiserState.expandedKeys !== state.lastInitialExpandedKeys
  ) {
    dispatch({
      type: 'syncFromProps',
      sources,
      sourcesKey,
      cruiseLoadId,
      initial: initialDependencyCruiserState,
    });
  }

  useEffect(() => {
    if (state.pendingLayout == null) {
      return;
    }
    if (graphRef.current == null) {
      return;
    }
    graphRef.current.setLayoutState(state.pendingLayout);
    // One-shot apply of restored/reset layout onto the graph handle.
    dispatch({ type: 'layoutApplied' });
  }, [state.pendingLayout, graphRef, state.selectedPaths, state.expandedKeys]);

  const resolvedActivePath =
    state.activePath != null && isPathInSources(state.activePath, sources) ? state.activePath : null;
  const resolvedDependenciesPath =
    state.dependenciesPath != null && isPathInSources(state.dependenciesPath, sources) ? state.dependenciesPath : null;

  const treeData = useMemo(() => buildFileTree(sources), [sources]);
  const allKeys = useMemo(() => getAllKeys(treeData), [treeData]);
  const allFolderKeys = useMemo(() => getAllFolderKeys(treeData), [treeData]);

  const panelOpen = resolvedDependenciesPath != null;

  const updateExpandedKeys = (updater: string[] | ((prev: string[]) => string[])) => {
    dispatch({ type: 'updateExpandedKeys', updater });
  };

  const activatePath = (path: string) => {
    dispatch({ type: 'activatePath', path });
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
    dispatch({ type: 'toggleFolder', path });
  };

  const expandRecursive = (path: string) => {
    dispatch({ type: 'expandRecursive', path, sources });
  };

  const handleShowDependenciesPanel = (path: string) => {
    dispatch({ type: 'setDependenciesPath', path });
  };

  const handleClosePanel = () => {
    dispatch({ type: 'setDependenciesPath', path: null });
  };

  const focusPath = (path: string) => {
    if (isPathVisibleInSelection(path, state.selectedPaths)) {
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

  const expandActive = () => {
    const folderPath = resolveActiveFolderPath(resolvedActivePath, sources);
    if (folderPath == null) {
      return;
    }
    updateExpandedKeys(keys => (keys.includes(folderPath) ? keys : [...keys, folderPath]));
  };

  const expandActiveRecursive = () => {
    const folderPath = resolveActiveFolderPath(resolvedActivePath, sources);
    if (folderPath == null) {
      return;
    }
    expandRecursive(folderPath);
  };

  const collapseActive = () => {
    const folderPath = resolveActiveFolderPath(resolvedActivePath, sources);
    if (folderPath == null) {
      return;
    }
    updateExpandedKeys(keys => (keys.includes(folderPath) ? keys.filter(key => key !== folderPath) : keys));
  };

  const collapseActiveRecursive = () => {
    const folderPath = resolveActiveFolderPath(resolvedActivePath, sources);
    if (folderPath == null) {
      return;
    }
    updateExpandedKeys(keys => removeSubtreeFolderKeys(keys, folderPath, sources));
  };

  const setUserDependencyHighlight = (dependencyKeys: readonly string[], color: string | null) => {
    dispatch({ type: 'setUserDependencyHighlight', keys: dependencyKeys, color });
  };

  const clearAllHighlights = () => {
    dispatch({ type: 'clearAllHighlights' });
  };

  const exportGraphDot = () => {
    graphRef.current?.exportDot();
  };

  const viewGraphDotOnline = () => {
    graphRef.current?.openDotOnline();
  };

  const getCurrentWorkspaceSettings = (): ViewerWorkspaceSettings | null => {
    if (unfilteredCruiseResult == null) {
      return null;
    }
    const layout = graphRef.current?.getLayoutState() ?? { autoLayoutOnly: true, nodePositions: {} };
    return {
      ignorePatterns,
      selectedFiles: state.selectedPaths.filter(key =>
        unfilteredCruiseResult.modules.some(module => module.source === key),
      ),
      expandedKeys: state.expandedKeys,
      dependenciesPath: resolvedDependenciesPath,
      userEdgeHighlights: Object.fromEntries(state.userEdgeHighlights.entries()),
      folderColors: state.folderBaseColors,
      autoLayoutOnly: layout.autoLayoutOnly,
      nodePositions: layout.autoLayoutOnly ? {} : layout.nodePositions,
    };
  };

  const saveWorkspace = () => {
    if (unfilteredCruiseResult == null) {
      return;
    }
    const settings = getCurrentWorkspaceSettings();
    if (settings == null) {
      return;
    }
    const payload = serializeViewerWorkspace(unfilteredCruiseResult, settings);
    downloadTextFile('cruise-result.json', `${JSON.stringify(payload, null, 2)}\n`, 'application/json');
  };

  const expandAllRecursive = () => {
    updateExpandedKeys(allFolderKeys);
  };

  const collapseAllRecursive = () => {
    updateExpandedKeys([]);
  };

  const selectAll = () => {
    dispatch({ type: 'setSelectedPaths', paths: allKeys });
  };

  const unselectAll = () => {
    dispatch({ type: 'setSelectedPaths', paths: [] });
  };

  const showPathsOnly = (paths: string[]) => {
    const sourceSet = new Set(sources);
    const filtered = paths.filter(path => sourceSet.has(path));
    dispatch({
      type: 'setSelectedPaths',
      paths: expandSelectionWithSelectedAncestors(filtered, sources),
    });
    if (filtered.length > 0) {
      updateExpandedKeys([...new Set(filtered.flatMap(getAncestorKeys))]);
    }
  };

  const sourcesForPath = (path: string): string[] => {
    if (isFolderPath(path, sources)) {
      return collectSourcesUnderFolder(path, sources);
    }
    return sources.includes(path) ? [path] : [];
  };

  const hideOthers = (path: string) => {
    const kept = new Set(sourcesForPath(path)).intersection(new Set(state.selectedPaths));

    dispatch({
      type: 'setSelectedPaths',
      paths: expandSelectionWithSelectedAncestors([...kept], sources),
    });
  };

  const showRelatedModules = (path: string, direction: RelatedModuleDirection) => {
    if (unfilteredCruiseResult == null) {
      return;
    }
    const modules = filterCruiseResult(unfilteredCruiseResult, ignorePatterns).modules;
    const related = collectRelatedModuleSources(path, modules, direction);
    const sourceSet = new Set(sources);
    const currentModuleSources = state.selectedPaths.filter(selected => sourceSet.has(selected));
    const nextSources = [...new Set([...currentModuleSources, ...sourcesForPath(path), ...related])];
    dispatch({
      type: 'setSelectedPaths',
      paths: expandSelectionWithSelectedAncestors(nextSources, sources),
    });
    if (related.length > 0) {
      updateExpandedKeys([...new Set([...state.expandedKeys, ...related.flatMap(getAncestorKeys)])]);
    }
  };

  const showDirectDependencies = (path: string) => {
    showRelatedModules(path, 'dependencies');
  };

  const showDirectDependents = (path: string) => {
    showRelatedModules(path, 'dependents');
  };

  const showCircularDependenciesOnly = () => {
    if (unfilteredCruiseResult == null) {
      return;
    }
    const modules = filterCruiseResult(unfilteredCruiseResult, ignorePatterns).modules;
    showPathsOnly(collectCircularModulePaths(modules));
  };

  const applyWorkspaceView = (input: {
    view: MergedViewerWorkspaceView;
    sourcesKey: string;
    cruiseLoadId: number;
    lastInitialSelectedKeys: string[];
    lastInitialExpandedKeys: string[];
  }) => {
    dispatch({ type: 'applyWorkspaceView', ...input });
  };

  return {
    panelOpen,
    selectedPaths: state.selectedPaths,
    expandedKeys: state.expandedKeys,
    activePath: resolvedActivePath,
    dependenciesPath: resolvedDependenciesPath,
    userEdgeHighlights: state.userEdgeHighlights,
    folderBaseColors: state.folderBaseColors,
    setUserEdgeHighlights: (highlights: ReadonlyMap<string, string>) => {
      dispatch({ type: 'setUserEdgeHighlights', highlights });
    },
    setUserDependencyHighlight,
    setSelectedPaths: (paths: string[]) => {
      dispatch({ type: 'setSelectedPaths', paths });
    },
    updateExpandedKeys,
    activatePath,
    showInGraph,
    showInFileTree,
    toggleFolder,
    expandRecursive,
    handleShowDependenciesPanel,
    handleClosePanel,
    handleQuickPickSelect,
    focusActivePath,
    clearLocalStorage,
    copyActive,
    viewActiveItemDependenciesPanel,
    expandActive,
    expandActiveRecursive,
    collapseActive,
    collapseActiveRecursive,
    clearAllHighlights,
    exportGraphDot,
    viewGraphDotOnline,
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
    applyWorkspaceView,
  };
}
