import type { VisibleTreeNode } from '@/domain';

/** Derived workspace fields maintained by `zustand-computed`. */
export interface WorkspaceComputedState {
  visibleTree: VisibleTreeNode[];
}
