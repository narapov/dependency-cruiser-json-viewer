export interface GraphLayoutState {
  autoLayoutOnly: boolean;
  nodePositions: Record<string, Record<string, { x: number; y: number }>>;
}

export interface DependencyGraphHandle {
  focusNode(path: string): void;
  selectEdge(edgeId: string): void;
  clearAllHighlights(): void;
  exportDot(): void;
  openDotOnline(): void;
  getLayoutState(): GraphLayoutState;
  setLayoutState(state: GraphLayoutState): void;
}
