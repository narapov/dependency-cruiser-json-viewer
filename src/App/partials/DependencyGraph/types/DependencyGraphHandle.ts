import type { GraphEdgeStyle } from '@/domain';

export interface GraphLayoutState {
  autoLayoutOnly: boolean;
  edgeStyle: GraphEdgeStyle;
  nodePositions: Record<string, Record<string, { x: number; y: number }>>;
}

export interface DependencyGraphHandle {
  focusNode(path: string): void;
  selectEdge(edgeId: string): void;
  clearAllHighlights(): void;
  exportDot(): void;
  openDotOnline(): void;
  openEdgeStylePicker(): void;
  getLayoutState(): GraphLayoutState;
  setLayoutState(state: GraphLayoutState): void;
}
