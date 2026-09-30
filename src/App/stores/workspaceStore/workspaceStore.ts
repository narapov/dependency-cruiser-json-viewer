import type { ICruiseResult } from 'dependency-cruiser';
import { create } from 'zustand';
import { createComputed } from 'zustand-computed';
import { combine } from 'zustand/middleware';

import {
  applyHighlightKeys,
  getCruiseSources,
  getInitialDependencyCruiserState,
  getVisibleTree,
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
import type { WorkspaceComputedState, WorkspaceOwnState, WorkspaceState, WorkspaceStateActions } from './types';

/** Placeholder snapshot before any cruise result is loaded. */
export const EMPTY_CRUISE_SNAPSHOT: CruiseSnapshot = {
  nodes: new Map(),
  tree: new Map(),
  dependencies: {
    byDependencyKey: new Map(),
    bySource: new Map(),
    byTarget: new Map(),
  },
  cycles: [],
  violations: new Map(),
};

const DEFAULT_GRAPH_SETTINGS: WorkspaceOwnState['graphSettings'] = {
  autoLayoutOnly: true,
  edgesType: 'bezier',
};

/** Initial own workspace fields (no cruise data). */
export const initialWorkspaceState: WorkspaceOwnState = {
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
  nodeLayouts: null,
};

function applySettingsToCruiseResult(
  cruiseResult: ICruiseResult,
  settings: ViewerWorkspaceSettings,
): WorkspaceOwnState {
  const stripped = stripViewerWorkspaceExtension(cruiseResult);
  const { filteredCruiseResult, cruiseSnapshot } = buildFilteredCruiseSnapshot(stripped, settings.ignorePatterns);
  const view = replaceWorkspaceSettings({
    sources: getCruiseSources(cruiseSnapshot),
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

function hardResetWithoutSettings(cruiseResult: ICruiseResult): WorkspaceOwnState {
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
    nodeLayouts: null,
  };
}

function softReset(cruiseResult: ICruiseResult, previous: WorkspaceOwnState): WorkspaceOwnState {
  const stripped = stripViewerWorkspaceExtension(cruiseResult);
  const { cruiseSnapshot } = buildFilteredCruiseSnapshot(stripped, previous.ignorePatterns);
  return reconcileWorkspaceAgainstSnapshot({
    cruiseResult: stripped,
    cruiseSnapshot,
    ignorePatterns: previous.ignorePatterns,
    previous,
  });
}

function pickOwnWorkspaceState(state: WorkspaceOwnState): WorkspaceOwnState {
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
    nodeLayouts: state.nodeLayouts,
  };
}

const computeVisibleTree = createComputed(
  (state: WorkspaceOwnState & WorkspaceStateActions): WorkspaceComputedState => ({
    visibleTree: getVisibleTree(state.cruiseSnapshot, state.selectedFilePaths, state.expandedFolderPaths),
  }),
  { keys: ['cruiseSnapshot', 'selectedFilePaths', 'expandedFolderPaths'] },
);

export const useWorkspaceStore = create<WorkspaceState>()(
  computeVisibleTree(
    combine(initialWorkspaceState, (set, get): WorkspaceStateActions => ({
      /** Initialize or re-bind workspace state from a cruise result. */
      reset(cruiseResult, mode) {
        const next =
          mode === 'hard'
            ? (() => {
                const embedded = extractEmbeddedWorkspaceSettings(cruiseResult);
                return embedded != null
                  ? applySettingsToCruiseResult(cruiseResult, embedded)
                  : hardResetWithoutSettings(cruiseResult);
              })()
            : softReset(cruiseResult, pickOwnWorkspaceState(get()));

        set(next);
        return next;
      },

      /** Apply external workspace settings against the current cruise result. */
      syncWorkspaceSettings(workspaceSettings) {
        const { cruiseResult } = get();
        if (cruiseResult == null) {
          throw new Error('syncWorkspaceSettings requires a loaded cruiseResult');
        }

        const next = applySettingsToCruiseResult(cruiseResult, workspaceSettings);
        set(next);
        return next;
      },

      setIgnorePatterns(ignorePatterns) {
        const previous = pickOwnWorkspaceState(get());
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

      setSelectedFilePaths(selectedFilePaths) {
        const { cruiseSnapshot } = get();
        set({
          selectedFilePaths: pathsToPresenceRecord(
            toSelectedFilePaths(presenceRecordToPaths(selectedFilePaths), cruiseSnapshot),
          ),
        });
      },

      setExpandedFolderPaths(expandedFolderPaths) {
        set({ expandedFolderPaths });
      },

      /** Replace expanded folders; when folders collapse, move activePath out of collapsed subtrees. */
      replaceExpandedFolderPaths(paths) {
        const previous = presenceRecordToPaths(get().expandedFolderPaths);
        const next = [...paths];
        const collapsed = previous.filter(key => !next.includes(key));
        const patch: Pick<WorkspaceOwnState, 'expandedFolderPaths'> & Partial<Pick<WorkspaceOwnState, 'activePath'>> = {
          expandedFolderPaths: pathsToPresenceRecord(next),
        };
        if (collapsed.length > 0) {
          patch.activePath = resolveActivePathAfterCollapse(get().activePath, collapsed);
        }
        set(patch);
      },

      setActivePath(activePath) {
        set({ activePath });
      },

      setDependenciesPanelPath(dependenciesPanelPath) {
        set({ dependenciesPanelPath });
      },

      setApplicableRulesPanelPath(applicableRulesPanelPath) {
        set({ applicableRulesPanelPath });
      },

      setUserEdgeHighlights(userEdgeHighlights) {
        set({ userEdgeHighlights });
      },

      setUserDependencyHighlight(dependencyKeys, color) {
        set({
          userEdgeHighlights: applyHighlightKeys(get().userEdgeHighlights, dependencyKeys, color),
        });
      },

      clearAllHighlights() {
        set({ userEdgeHighlights: new Map() });
      },

      setGraphSettings(graphSettings) {
        set({ graphSettings });
      },

      setNodePositions(nodePositions) {
        set({ nodePositions });
      },

      setNodeLayouts(nodeLayouts) {
        set({ nodeLayouts });
      },
    })),
  ),
);
