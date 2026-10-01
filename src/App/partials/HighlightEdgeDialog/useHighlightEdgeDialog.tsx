import { useState, type ReactNode } from 'react';

import { HighlightEdgeDialog } from './HighlightEdgeDialog';

interface UseHighlightEdgeDialogOptions {
  onConfirm: (dependencyKeys: readonly string[], color: string | null) => void;
}

/**
 * Owns highlight-edge dialog open-state and returns the opener plus dialog node.
 */
export function useHighlightEdgeDialog(config: UseHighlightEdgeDialogOptions): {
  openHighlightEdge: () => void;
  highlightEdgeDialog: ReactNode;
} {
  const { onConfirm } = config;

  const [open, setOpen] = useState(false);

  const openHighlightEdge = () => {
    setOpen(true);
  };

  const highlightEdgeDialog = <HighlightEdgeDialog open={open} onConfirm={onConfirm} onClose={() => setOpen(false)} />;

  return { openHighlightEdge, highlightEdgeDialog };
}
