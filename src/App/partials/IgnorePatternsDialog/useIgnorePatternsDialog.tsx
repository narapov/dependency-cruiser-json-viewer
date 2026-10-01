import { useState, type ReactNode } from 'react';

import { useWorkspaceStore } from '../../stores/workspaceStore';
import { IgnorePatternsDialog } from './IgnorePatternsDialog';

/**
 * Owns ignore-patterns dialog open-state and returns the opener plus dialog node.
 * Patterns and save wire to the workspace store.
 */
export function useIgnorePatternsDialog(): {
  openIgnorePatterns: () => void;
  ignorePatternsDialog: ReactNode;
} {
  const patterns = useWorkspaceStore(state => state.ignorePatterns);
  const setIgnorePatterns = useWorkspaceStore(state => state.setIgnorePatterns);
  const [open, setOpen] = useState(false);

  const openIgnorePatterns = () => {
    setOpen(true);
  };

  const ignorePatternsDialog = (
    <IgnorePatternsDialog open={open} patterns={patterns} onClose={() => setOpen(false)} onSave={setIgnorePatterns} />
  );

  return { openIgnorePatterns, ignorePatternsDialog };
}
