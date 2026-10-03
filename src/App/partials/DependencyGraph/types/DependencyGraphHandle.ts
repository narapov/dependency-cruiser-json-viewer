import type { GraphEdgesType } from '@/domain';

import type { SerializedLayoutCache } from './SerializedLayoutCache';

export interface GraphLayoutState {
  autoLayoutOnly: boolean;
  edgesType: GraphEdgesType;
  nodeLayouts: SerializedLayoutCache;
}

export interface DependencyGraphHandle {
  focusNode(path: string): void;
  selectEdge(edgeId: string): void;
  clearAllHighlights(): void;
  exportDot(): void;
  openDotOnline(): void;
  getLayoutState(): GraphLayoutState;
}
