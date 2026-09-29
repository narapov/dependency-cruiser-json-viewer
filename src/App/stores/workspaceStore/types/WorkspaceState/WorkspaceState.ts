import type { ICruiseResult } from 'dependency-cruiser';

import type {
  CruiseSnapshot,
  FolderBaseColor,
  GraphEdgesType,
  ViewerWorkspaceSettings,
  VisibleTreeNode,
} from '@/domain';

/** How `reset` applies a new cruise result relative to current store state. */
export type WorkspaceResetMode = 'soft' | 'hard';

/** Mutable workspace fields owned by the store (excluding computed + actions). */
export interface WorkspaceOwnState {
  cruiseResult: ICruiseResult | null;
  ignorePatterns: string[];
  selectedFilePaths: Record<string, boolean | undefined>;
  cruiseSnapshot: CruiseSnapshot;
  folderBaseColors: Record<string, FolderBaseColor>;
  expandedFolderPaths: Record<string, boolean | undefined>;
  activePath: string | null;
  dependenciesPanelPath: string | null;
  applicableRulesPanelPath: string | null;
  userEdgeHighlights: ReadonlyMap<string, string>;
  graphSettings: {
    autoLayoutOnly: boolean;
    edgesType: GraphEdgesType;
  };
  nodePositions: Record<string, Record<string, { x: number; y: number } | undefined>> | null;
}

/** Derived workspace fields maintained by `zustand-computed`. */
export interface WorkspaceComputedState {
  visibleTree: VisibleTreeNode[];
}

/** Workspace store action methods. */
export interface WorkspaceStateActions {
  reset: (cruiseResult: ICruiseResult, mode: WorkspaceResetMode) => WorkspaceOwnState;
  syncWorkspaceSettings: (workspaceSettings: ViewerWorkspaceSettings) => WorkspaceOwnState;
  setIgnorePatterns: (ignorePatterns: string[]) => void;
  setSelectedFilePaths: (selectedFilePaths: WorkspaceOwnState['selectedFilePaths']) => void;
  setExpandedFolderPaths: (expandedFolderPaths: WorkspaceOwnState['expandedFolderPaths']) => void;
  replaceExpandedFolderPaths: (paths: readonly string[]) => void;
  setActivePath: (activePath: string | null) => void;
  setDependenciesPanelPath: (dependenciesPanelPath: string | null) => void;
  setApplicableRulesPanelPath: (applicableRulesPanelPath: string | null) => void;
  setUserEdgeHighlights: (userEdgeHighlights: WorkspaceOwnState['userEdgeHighlights']) => void;
  setUserDependencyHighlight: (dependencyKeys: readonly string[], color: string | null) => void;
  clearAllHighlights: () => void;
  setGraphSettings: (graphSettings: WorkspaceOwnState['graphSettings']) => void;
  setNodePositions: (nodePositions: WorkspaceOwnState['nodePositions']) => void;
}

/** Full workspace store shape: own fields + computed + actions. */
export type WorkspaceState = WorkspaceOwnState & WorkspaceComputedState & WorkspaceStateActions;
