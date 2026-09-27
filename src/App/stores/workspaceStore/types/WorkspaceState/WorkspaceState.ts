import type { ICruiseResult } from 'dependency-cruiser';

import type { CruiseSnapshot, FolderBaseColor, GraphEdgesType } from '@/domain';

/** Runtime workspace UI state held by `useWorkspaceStore`. */
export interface WorkspaceState {
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

/** How `reset` applies a new cruise result relative to current store state. */
export type WorkspaceResetMode = 'soft' | 'hard';
