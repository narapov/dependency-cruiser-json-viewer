import type { ICruiseResult } from 'dependency-cruiser';

import type { CruiseSnapshot, FolderBaseColor, GraphEdgesType, ViewerNodeLayouts } from '@/domain';

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
  nodeLayouts: ViewerNodeLayouts | null;
}
