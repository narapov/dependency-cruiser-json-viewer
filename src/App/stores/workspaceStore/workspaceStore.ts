import type { ICruiseResult } from 'dependency-cruiser';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

import {
  applyHighlightKeys,
  getInitialDependencyCruiserState,
  replaceWorkspaceSettings,
  resolveActivePathAfterCollapse,
  stripViewerWorkspaceExtension,
  toSelectedFilePaths,
  type CruiseSnapshot,
  type ViewerWorkspaceSettings,
} from '@/domain';

import { defaultFolderColorsRecord } from '../../helpers';
import {
  buildFilteredCruiseSnapshot,
  extractEmbeddedWorkspaceSettings,
  mapMergedViewToWorkspaceFields,
  pathsToPresenceRecord,
  presenceRecordToPaths,
  reconcileWorkspaceAgainstSnapshot,
} from './helpers';
import type { WorkspaceResetMode, WorkspaceState } from './types';

/** Placeholder snapshot before any cruise result is loaded. */
export const EMPTY_CRUISE_SNAPSHOT: CruiseSnapshot = {
  nodes: new Map(),
  rootPaths: [],
  tree: [],
  descendantFiles: [],
  modulesDependencies: new Map(),
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
  cruiseSnapshot: EMPTY_CRUISE_SNAPSHOT,
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
  const { filteredCruiseResult, cruiseSnapshot } = buildFilteredCruiseSnapshot(stripped, settings.ignorePatterns);
  const view = replaceWorkspaceSettings({
    sources: cruiseSnapshot.descendantFiles,
    modules: filteredCruiseResult.modules,
    settings,
    defaultFolderColors: defaultFolderColorsRecord(cruiseSnapshot),
  });

  return {
    cruiseResult: stripped,
    ignorePatterns: settings.ignorePatterns,
    cruiseSnapshot,
    ...mapMergedViewToWorkspaceFields(view),
  };
}

function hardResetWithoutSettings(cruiseResult: ICruiseResult): WorkspaceState {
  const stripped = stripViewerWorkspaceExtension(cruiseResult);
  const { cruiseSnapshot } = buildFilteredCruiseSnapshot(stripped, []);
  const initial = getInitialDependencyCruiserState(cruiseSnapshot);

  return {
    cruiseResult: stripped,
    ignorePatterns: [],
    selectedFilePaths: pathsToPresenceRecord(initial.selectedKeys),
    cruiseSnapshot,
    folderBaseColors: defaultFolderColorsRecord(cruiseSnapshot),
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
  const { cruiseSnapshot } = buildFilteredCruiseSnapshot(stripped, previous.ignorePatterns);
  return reconcileWorkspaceAgainstSnapshot({
    cruiseResult: stripped,
    cruiseSnapshot,
    ignorePatterns: previous.ignorePatterns,
    previous,
  });
}

function pickWorkspaceState(state: WorkspaceState): WorkspaceState {
  return {
    cruiseResult: state.cruiseResult,
    ignorePatterns: state.ignorePatterns,
    selectedFilePaths: state.selectedFilePaths,
    cruiseSnapshot: state.cruiseSnapshot,
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

      const { cruiseSnapshot } = buildFilteredCruiseSnapshot(previous.cruiseResult, ignorePatterns);
      set(
        reconcileWorkspaceAgainstSnapshot({
          cruiseResult: previous.cruiseResult,
          cruiseSnapshot,
          ignorePatterns,
          previous,
        }),
      );
    },

    setSelectedFilePaths(selectedFilePaths: WorkspaceState['selectedFilePaths']): void {
      const { cruiseSnapshot } = get();
      set({
        selectedFilePaths: pathsToPresenceRecord(
          toSelectedFilePaths(presenceRecordToPaths(selectedFilePaths), cruiseSnapshot),
        ),
      });
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
