import { create } from 'zustand';

interface SelectedDependencyEdgeState {
  selectedEdgeId: string | null;
  setSelectedEdgeId: (selectedEdgeId: string | null) => void;
}

/** Ephemeral selected-edge id for graph stroke emphasis (not workspace settings). */
export const useSelectedDependencyEdgeStore = create<SelectedDependencyEdgeState>(set => ({
  selectedEdgeId: null,
  setSelectedEdgeId: selectedEdgeId => set({ selectedEdgeId }),
}));
