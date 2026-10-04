import {
  collectFolderPathsToCollapse,
  collectFolderPathsToExpand,
  collectRelatedModuleSources,
  getCruiseSourcesUnder,
  isFileInSnapshot,
  resolveFolderNodes,
  type RelatedModuleDirection,
} from '@/domain';

import {
  pathsToAbsenceRecord,
  pathsToPresenceRecord,
  presenceRecordToPaths,
  useWorkspaceStore,
} from '../../../../../../stores/workspaceStore';

/** Workspace mutations used by graph nodes and context menus. */
export function useGraphWorkspaceActions() {
  const cruiseSnapshot = useWorkspaceStore(state => state.cruiseSnapshot);
  const setSelectedFilePaths = useWorkspaceStore(state => state.setSelectedFilePaths);
  const setExpandedFolderPaths = useWorkspaceStore(state => state.setExpandedFolderPaths);
  const setActivePath = useWorkspaceStore(state => state.setActivePath);
  const setDependenciesPanelPath = useWorkspaceStore(state => state.setDependenciesPanelPath);
  const setApplicableRulesPanelPath = useWorkspaceStore(state => state.setApplicableRulesPanelPath);

  const toggleFolder = (path: string) => {
    const { expandedFolderPaths } = useWorkspaceStore.getState();
    setExpandedFolderPaths({ [path]: !expandedFolderPaths[path] });
  };

  const expandFoldersToLevel = (paths: readonly string[], level: number) => {
    const folderNodes = resolveFolderNodes(cruiseSnapshot.nodes, paths);
    const toExpand = collectFolderPathsToExpand(folderNodes, level);
    if (toExpand.length > 0) {
      setExpandedFolderPaths(pathsToPresenceRecord(toExpand));
    }
  };

  const collapseFoldersToLevel = (paths: readonly string[], level: number) => {
    const folderNodes = resolveFolderNodes(cruiseSnapshot.nodes, paths);
    const toCollapse = collectFolderPathsToCollapse(folderNodes, level);
    if (toCollapse.length > 0) {
      setExpandedFolderPaths(pathsToAbsenceRecord(toCollapse));
    }
  };

  const expandRecursive = (path: string) => {
    expandFoldersToLevel([path], Infinity);
  };

  const collapseRecursive = (path: string) => {
    const folderNodes = resolveFolderNodes(cruiseSnapshot.nodes, [path]);
    const toCollapse = [...folderNodes.map(node => node.path), ...collectFolderPathsToCollapse(folderNodes, 1)];
    if (toCollapse.length > 0) {
      setExpandedFolderPaths(pathsToAbsenceRecord(toCollapse));
    }
  };

  const expandToLevel = (path: string, level: number) => {
    expandFoldersToLevel([path], level);
  };

  const collapseToLevel = (path: string, level: number) => {
    collapseFoldersToLevel([path], level);
  };

  const activatePath = (path: string) => {
    const ancestors = cruiseSnapshot.nodes.get(path)?.ancestors ?? [];
    if (ancestors.length > 0) {
      setExpandedFolderPaths(pathsToPresenceRecord(ancestors));
    }
    setActivePath(path);
  };

  const showDependenciesPanel = (path: string) => {
    setDependenciesPanelPath(path);
  };

  const showApplicableRulesPanel = (path: string) => {
    setApplicableRulesPanelPath(path);
  };

  const setSelectedPaths = (paths: string[]) => {
    setSelectedFilePaths(pathsToPresenceRecord(paths));
  };

  const sourcesForPath = (path: string): string[] => getCruiseSourcesUnder(cruiseSnapshot, path);

  const hideOthers = (path: string) => {
    const selectedPaths = presenceRecordToPaths(useWorkspaceStore.getState().selectedFilePaths);
    const kept = new Set(sourcesForPath(path)).intersection(new Set(selectedPaths));
    setSelectedPaths([...kept]);
  };

  const showRelatedModules = (path: string, direction: RelatedModuleDirection) => {
    const selectedPaths = presenceRecordToPaths(useWorkspaceStore.getState().selectedFilePaths);
    const related = collectRelatedModuleSources(cruiseSnapshot, path, direction);
    const currentModuleSources = selectedPaths.filter(selected => isFileInSnapshot(cruiseSnapshot, selected));
    const nextSources = [...new Set([...currentModuleSources, ...sourcesForPath(path), ...related])];
    setSelectedPaths(nextSources);
    if (related.length > 0) {
      setExpandedFolderPaths(
        pathsToPresenceRecord([
          ...new Set(related.flatMap(relatedPath => cruiseSnapshot.nodes.get(relatedPath)?.ancestors ?? [])),
        ]),
      );
    }
  };

  const showDirectDependencies = (path: string) => {
    showRelatedModules(path, 'dependencies');
  };

  const showDirectDependents = (path: string) => {
    showRelatedModules(path, 'dependents');
  };

  return {
    toggleFolder,
    expandRecursive,
    collapseRecursive,
    expandToLevel,
    collapseToLevel,
    activatePath,
    showDependenciesPanel,
    showApplicableRulesPanel,
    hideOthers,
    showDirectDependencies,
    showDirectDependents,
  };
}
