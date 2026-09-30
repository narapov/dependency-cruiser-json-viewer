/** Theme-independent folder pastel identity. */
export interface FolderBaseColor {
  hue: number;
  lightnessIndex: number;
}

/** SVG path style for dependency graph edges. */
export type GraphEdgesType = 'bezier' | 'straight' | 'simpleOrthogonal';

/** Persisted child geometry within a folder group. */
export interface ViewerChildLayout {
  id: string;
  position: { x: number; y: number };
  width?: number;
  height?: number;
}

/** Persisted layout for one parent group and its direct children. */
export interface ViewerGroupLayout {
  id: string;
  width?: number;
  height?: number;
  children: Record<string, ViewerChildLayout>;
}

/** Persisted group layout cache (`""` = root). */
export type ViewerNodeLayouts = Record<string, ViewerGroupLayout>;

/** Viewer UI settings stored under the cruise-result extension field. */
export interface ViewerWorkspaceSettings {
  ignorePatterns: string[];
  selectedFiles: string[];
  expandedKeys: string[];
  dependenciesPath: string | null;
  applicableRulesPath: string | null;
  userEdgeHighlights: Record<string, string>;
  folderColors: Record<string, FolderBaseColor>;
  autoLayoutOnly: boolean;
  edgesType: GraphEdgesType;
  /** @deprecated Prefer `nodeLayouts`; kept for legacy workspace files. */
  nodePositions: Record<string, Record<string, { x: number; y: number }>>;
  nodeLayouts: ViewerNodeLayouts;
}

/** Resolved view state after merging workspace settings with the current graph. */
export interface MergedViewerWorkspaceView {
  selectedFiles: string[];
  expandedKeys: string[];
  dependenciesPath: string | null;
  applicableRulesPath: string | null;
  userEdgeHighlights: ReadonlyMap<string, string>;
  folderColors: Record<string, FolderBaseColor>;
  autoLayoutOnly: boolean;
  edgesType: GraphEdgesType;
  nodePositions: Record<string, Record<string, { x: number; y: number }>>;
  nodeLayouts: ViewerNodeLayouts;
}
