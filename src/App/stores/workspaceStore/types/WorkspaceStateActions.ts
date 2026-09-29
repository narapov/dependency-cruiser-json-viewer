import type { ICruiseResult } from 'dependency-cruiser';

import type { ViewerWorkspaceSettings } from '@/domain';

import type { WorkspaceOwnState } from './WorkspaceOwnState';
import type { WorkspaceResetMode } from './WorkspaceResetMode';

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
