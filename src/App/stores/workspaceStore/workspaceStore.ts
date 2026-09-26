import type { ICruiseResult } from 'dependency-cruiser';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

import {
  applyHighlightKeys,
  getInitialDependencyCruiserState,
  replaceWorkspaceSettings,
  resolveActivePathAfterCollapse,
  stripViewerWorkspaceExtension,
  type CruiseTreeSnapshot,
  type ViewerWorkspaceSettings,
} from '@/domain';

import { defaultFolderColorsRecord } from '../../helpers';
import {
  buildFilteredCruiseTree,
  extractEmbeddedWorkspaceSettings,
  mapMergedViewToWorkspaceFields,
  pathsToPresenceRecord,
  presenceRecordToPaths,
  reconcileWorkspaceAgainstTree,
} from './helpers';
import type { WorkspaceResetMode, WorkspaceState } from './types';

/** Placeholder snapshot before any cruise result is loaded. */
export const EMPTY_CRUISE_TREE: CruiseTreeSnapshot = {
  nodes: new Map(),
  rootPaths: [],
  descendantFiles: [],
  cycles: [],
  violations: [],
};

const DEFAULT_GRAPH_SETTINGS: WorkspaceState['graphSettings'] = {
  autoLayoutOnly: true,
  edgesType: 'bezier',
};

/** Initial workspace state (no cruise data). */
export const initialWorkspaceState: WorkspaceState = {
  cruiseResult: null,
  ignorePatterns: [],
  selectedFilePaths: {},
  cruiseTree: EMPTY_CRUISE_TREE,
  folderBaseColors: {},
  expandedFolderPaths: {},
  activePath: null,
  dependenciesPanelPath: null,
  applicableRulesPanelPath: null,
  userEdgeHighlights: new Map(),
  graphSettings: DEFAULT_GRAPH_SETTINGS,
  nodePositions: null,
};

function applySettingsToCruiseResult(cruiseResult: ICruiseResult, settings: ViewerWorkspaceSettings): WorkspaceState {
  const stripped = stripViewerWorkspaceExtension(cruiseResult);
  const { filtered, cruiseTree } = buildFilteredCruiseTree(stripped, settings.ignorePatterns);
  const view = replaceWorkspaceSettings({
    sources: cruiseTree.descendantFiles,
    modules: filtered.modules,
    settings,
    defaultFolderColors: defaultFolderColorsRecord(cruiseTree),
  });

  return {
    cruiseResult: stripped,
    ignorePatterns: settings.ignorePatterns,
    cruiseTree,
    ...mapMergedViewToWorkspaceFields(view),
  };
}

function hardResetWithoutSettings(cruiseResult: ICruiseResult): WorkspaceState {
  const stripped = stripViewerWorkspaceExtension(cruiseResult);
  const { cruiseTree } = buildFilteredCruiseTree(stripped, []);
  const initial = getInitialDependencyCruiserState(cruiseTree.descendantFiles);

  return {
    cruiseResult: stripped,
    ignorePatterns: [],
    selectedFilePaths: pathsToPresenceRecord(initial.selectedKeys),
    cruiseTree,
    folderBaseColors: defaultFolderColorsRecord(cruiseTree),
    expandedFolderPaths: pathsToPresenceRecord(initial.expandedKeys),
    activePath: null,
    dependenciesPanelPath: null,
    applicableRulesPanelPath: null,
    userEdgeHighlights: new Map(),
    graphSettings: DEFAULT_GRAPH_SETTINGS,
    nodePositions: null,
  };
}

function softReset(cruiseResult: ICruiseResult, previous: WorkspaceState): WorkspaceState {
  const stripped = stripViewerWorkspaceExtension(cruiseResult);
  const { cruiseTree } = buildFilteredCruiseTree(stripped, previous.ignorePatterns);
  return reconcileWorkspaceAgainstTree({
    cruiseResult: stripped,
    cruiseTree,
    ignorePatterns: previous.ignorePatterns,
    previous,
  });
}

function pickWorkspaceState(state: WorkspaceState): WorkspaceState {
  return {
    cruiseResult: state.cruiseResult,
    ignorePatterns: state.ignorePatterns,
    selectedFilePaths: state.selectedFilePaths,
    cruiseTree: state.cruiseTree,
    folderBaseColors: state.folderBaseColors,
    expandedFolderPaths: state.expandedFolderPaths,
    activePath: state.activePath,
    dependenciesPanelPath: state.dependenciesPanelPath,
    applicableRulesPanelPath: state.applicableRulesPanelPath,
    userEdgeHighlights: state.userEdgeHighlights,
    graphSettings: state.graphSettings,
    nodePositions: state.nodePositions,
  };
}

export const useWorkspaceStore = create(
  combine(initialWorkspaceState, (set, get) => ({
    /** Initialize or re-bind workspace state from a cruise result. */
    reset(cruiseResult: ICruiseResult, mode: WorkspaceResetMode): WorkspaceState {
      const next =
        mode === 'hard'
          ? (() => {
              const embedded = extractEmbeddedWorkspaceSettings(cruiseResult);
              return embedded != null
                ? applySettingsToCruiseResult(cruiseResult, embedded)
                : hardResetWithoutSettings(cruiseResult);
            })()
          : softReset(cruiseResult, pickWorkspaceState(get()));

      set(next);
      return next;
    },

    /** Apply external workspace settings against the current cruise result. */
    syncWorkspaceSettings(workspaceSettings: ViewerWorkspaceSettings): WorkspaceState {
      const { cruiseResult } = get();
      if (cruiseResult == null) {
        throw new Error('syncWorkspaceSettings requires a loaded cruiseResult');
      }

      const next = applySettingsToCruiseResult(cruiseResult, workspaceSettings);
      set(next);
      return next;
    },

    setIgnorePatterns(ignorePatterns: string[]): void {
      const previous = pickWorkspaceState(get());
      if (previous.cruiseResult == null) {
        set({ ignorePatterns });
        return;
      }

      const { cruiseTree } = buildFilteredCruiseTree(previous.cruiseResult, ignorePatterns);
      set(
        reconcileWorkspaceAgainstTree({
          cruiseResult: previous.cruiseResult,
          cruiseTree,
          ignorePatterns,
          previous,
        }),
      );
    },

    setSelectedFilePaths(selectedFilePaths: WorkspaceState['selectedFilePaths']): void {
      set({ selectedFilePaths });
    },

    setExpandedFolderPaths(expandedFolderPaths: WorkspaceState['expandedFolderPaths']): void {
      set({ expandedFolderPaths });
    },

    /** Replace expanded folders; when folders collapse, move activePath out of collapsed subtrees. */
    replaceExpandedFolderPaths(paths: readonly string[]): void {
      const previous = presenceRecordToPaths(get().expandedFolderPaths);
      const next = [...paths];
      const collapsed = previous.filter(key => !next.includes(key));
      const patch: Pick<WorkspaceState, 'expandedFolderPaths'> & Partial<Pick<WorkspaceState, 'activePath'>> = {
        expandedFolderPaths: pathsToPresenceRecord(next),
      };
      if (collapsed.length > 0) {
        patch.activePath = resolveActivePathAfterCollapse(get().activePath, collapsed);
      }
      set(patch);
    },

    setActivePath(activePath: string | null): void {
      set({ activePath });
    },

    setDependenciesPanelPath(dependenciesPanelPath: string | null): void {
      set({ dependenciesPanelPath });
    },

    setApplicableRulesPanelPath(applicableRulesPanelPath: string | null): void {
      set({ applicableRulesPanelPath });
    },

    setUserEdgeHighlights(userEdgeHighlights: WorkspaceState['userEdgeHighlights']): void {
      set({ userEdgeHighlights });
    },

    setUserDependencyHighlight(dependencyKeys: readonly string[], color: string | null): void {
      set({
        userEdgeHighlights: applyHighlightKeys(get().userEdgeHighlights, dependencyKeys, color),
      });
    },

    clearAllHighlights(): void {
      set({ userEdgeHighlights: new Map() });
    },

    setGraphSettings(graphSettings: WorkspaceState['graphSettings']): void {
      set({ graphSettings });
    },

    setNodePositions(nodePositions: WorkspaceState['nodePositions']): void {
      set({ nodePositions });
    },
  })),
);
