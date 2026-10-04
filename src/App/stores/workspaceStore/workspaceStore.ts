import type { ICruiseResult } from 'dependency-cruiser';
import { create } from 'zustand';
import { createComputed } from 'zustand-computed';
import { combine } from 'zustand/middleware';

import {
  applyHighlightKeys,
  buildCruiseSnapshotFromResult,
  getInitialDependencyCruiserState,
  getVisibleTree,
  replaceWorkspaceSettings,
  stripViewerWorkspaceExtension,
  toSelectedFilePaths,
  type CruiseSnapshot,
  type ViewerWorkspaceSettings,
} from '@/domain';

import { defaultFolderColorsRecord } from '../../helpers';
import {
  extractEmbeddedWorkspaceSettings,
  haveSamePresentPaths,
  mapMergedViewToWorkspaceFields,
  pathsToPresenceRecord,
  presenceRecordToPaths,
  reconcileWorkspaceAgainstSnapshot,
  resolveActivePathAfterCollapse,
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
  rules: [],
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
  nodeLayouts: null,
};

function applySettingsToCruiseResult(
  cruiseResult: ICruiseResult,
  settings: ViewerWorkspaceSettings,
): WorkspaceOwnState {
  const stripped = stripViewerWorkspaceExtension(cruiseResult);
  const cruiseSnapshot = buildCruiseSnapshotFromResult(stripped, settings.ignorePatterns);
  const view = replaceWorkspaceSettings({
    cruiseSnapshot,
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
  const cruiseSnapshot = buildCruiseSnapshotFromResult(stripped, []);
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
    nodeLayouts: null,
  };
}

function softReset(cruiseResult: ICruiseResult, previous: WorkspaceOwnState): WorkspaceOwnState {
  const stripped = stripViewerWorkspaceExtension(cruiseResult);
  const cruiseSnapshot = buildCruiseSnapshotFromResult(stripped, previous.ignorePatterns);
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
    nodeLayouts: state.nodeLayouts,
  };
}

const computeVisibleTree = createComputed(
  (state: WorkspaceOwnState & WorkspaceStateActions): WorkspaceComputedState => ({
    visibleTree: getVisibleTree(state.cruiseSnapshot, state.selectedFilePaths, state.expandedFolderPaths),
  }),
  {
    // `next` is the set() patch (partial), not a full store snapshot.
    shouldRecompute: (prev, next) =>
      ('cruiseSnapshot' in next && prev.cruiseSnapshot !== next.cruiseSnapshot) ||
      ('selectedFilePaths' in next && !haveSamePresentPaths(prev.selectedFilePaths, next.selectedFilePaths ?? {})) ||
      ('expandedFolderPaths' in next &&
        !haveSamePresentPaths(prev.expandedFolderPaths, next.expandedFolderPaths ?? {})),
  },
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
                return embedded
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
        if (!cruiseResult) {
          throw new Error('syncWorkspaceSettings requires a loaded cruiseResult');
        }

        const next = applySettingsToCruiseResult(cruiseResult, workspaceSettings);
        set(next);
        return next;
      },

      setIgnorePatterns(ignorePatterns) {
        const previous = pickOwnWorkspaceState(get());
        if (!previous.cruiseResult) {
          set({ ignorePatterns });
          return;
        }

        const cruiseSnapshot = buildCruiseSnapshotFromResult(previous.cruiseResult, ignorePatterns);
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

      /** Merge (default) or replace expanded folders; on collapse, move activePath out of collapsed subtrees. */
      setExpandedFolderPaths(next, options) {
        const previous = get().expandedFolderPaths;
        const expandedFolderPaths = options?.replace ? next : { ...previous, ...next };
        const collapsed = Object.keys(previous).filter(key => previous[key] === true && !expandedFolderPaths[key]);
        const patch: Pick<WorkspaceOwnState, 'expandedFolderPaths'> & Partial<Pick<WorkspaceOwnState, 'activePath'>> = {
          expandedFolderPaths,
        };
        if (collapsed.length > 0) {
          const { activePath, cruiseSnapshot } = get();
          const ancestors = activePath ? (cruiseSnapshot.nodes.get(activePath)?.ancestors ?? []) : [];
          patch.activePath = resolveActivePathAfterCollapse(activePath, collapsed, ancestors);
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
    })),
  ),
);
