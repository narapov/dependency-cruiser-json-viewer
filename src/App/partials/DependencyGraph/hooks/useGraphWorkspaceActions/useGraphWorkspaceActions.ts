import {
  collectRelatedModuleSources,
  getAncestorKeys,
  getCruiseModules,
  getCruiseSourcesUnder,
  getSubtreeFolderKeys,
  toggleExpandedKey,
  type RelatedModuleDirection,
} from '@/domain';

import { pathsToPresenceRecord, presenceRecordToPaths, useWorkspaceStore } from '../../../../stores/workspaceStore';

/** Workspace mutations used by graph nodes and context menus. */
export function useGraphWorkspaceActions() {
  const cruiseSnapshot = useWorkspaceStore(state => state.cruiseSnapshot);
  const setSelectedFilePaths = useWorkspaceStore(state => state.setSelectedFilePaths);
  const replaceExpandedFolderPaths = useWorkspaceStore(state => state.replaceExpandedFolderPaths);
  const setExpandedFolderPaths = useWorkspaceStore(state => state.setExpandedFolderPaths);
  const setActivePath = useWorkspaceStore(state => state.setActivePath);
  const setDependenciesPanelPath = useWorkspaceStore(state => state.setDependenciesPanelPath);
  const setApplicableRulesPanelPath = useWorkspaceStore(state => state.setApplicableRulesPanelPath);

  const sources = cruiseSnapshot.descendantFiles;

  const toggleFolder = (path: string) => {
    const previous = presenceRecordToPaths(useWorkspaceStore.getState().expandedFolderPaths);
    replaceExpandedFolderPaths(toggleExpandedKey(previous, path));
  };

  const expandRecursive = (path: string) => {
    const previous = presenceRecordToPaths(useWorkspaceStore.getState().expandedFolderPaths);
    replaceExpandedFolderPaths([...new Set([...previous, ...getSubtreeFolderKeys(path, sources)])]);
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
    const expandedKeys = presenceRecordToPaths(useWorkspaceStore.getState().expandedFolderPaths);
    const related = collectRelatedModuleSources(path, getCruiseModules(cruiseSnapshot), direction);
    const sourceSet = new Set(sources);
    const currentModuleSources = selectedPaths.filter(selected => sourceSet.has(selected));
    const nextSources = [...new Set([...currentModuleSources, ...sourcesForPath(path), ...related])];
    setSelectedPaths(nextSources);
    if (related.length > 0) {
      replaceExpandedFolderPaths([...new Set([...expandedKeys, ...related.flatMap(getAncestorKeys)])]);
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
    activatePath,
    showDependenciesPanel,
    showApplicableRulesPanel,
    hideOthers,
    showDirectDependencies,
    showDirectDependents,
  };
}
