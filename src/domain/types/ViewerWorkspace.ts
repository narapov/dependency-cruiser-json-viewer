/** Theme-independent folder pastel identity. */
export interface FolderBaseColor {
  hue: number;
  lightnessIndex: number;
}

/** Viewer UI settings stored under the cruise-result extension field. */
export interface ViewerWorkspaceSettings {
  ignorePatterns: string[];
  selectedFiles: string[];
  expandedKeys: string[];
  dependenciesPath: string | null;
  userEdgeHighlights: Record<string, string>;
  folderColors: Record<string, FolderBaseColor>;
  autoLayoutOnly: boolean;
  nodePositions: Record<string, Record<string, { x: number; y: number }>>;
}

/** Resolved view state after merging workspace settings with the current graph. */
export interface MergedViewerWorkspaceView {
  selectedFiles: string[];
  expandedKeys: string[];
  dependenciesPath: string | null;
  userEdgeHighlights: ReadonlyMap<string, string>;
  folderColors: Record<string, FolderBaseColor>;
  autoLayoutOnly: boolean;
  nodePositions: Record<string, Record<string, { x: number; y: number }>>;
}
