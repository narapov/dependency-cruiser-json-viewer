import type { GraphEdgesType } from '@/domain';

export interface GraphLayoutState {
  autoLayoutOnly: boolean;
  edgesType: GraphEdgesType;
  nodePositions: Record<string, Record<string, { x: number; y: number }>>;
}

export interface DependencyGraphHandle {
  focusNode(path: string): void;
  selectEdge(edgeId: string): void;
  clearAllHighlights(): void;
  exportDot(): void;
  openDotOnline(): void;
  openEdgesTypePicker(): void;
  getLayoutState(): GraphLayoutState;
  setLayoutState(state: GraphLayoutState): void;
}
