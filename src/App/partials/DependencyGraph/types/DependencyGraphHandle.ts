import type { GraphEdgesType } from '@/domain';

import type { SerializedLayoutCache } from './SerializedLayoutCache';

export interface GraphLayoutState {
  autoLayoutOnly: boolean;
  edgesType: GraphEdgesType;
  nodePositions: Record<string, Record<string, { x: number; y: number }>>;
  nodeLayouts: SerializedLayoutCache;
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
