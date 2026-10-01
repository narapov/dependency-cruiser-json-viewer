import { useState, type ReactNode } from 'react';

import { AboutDialog } from './AboutDialog';

/**
 * Owns About dialog open-state and returns the opener plus dialog node.
 */
export function useAboutDialog(): {
  openAbout: () => void;
  aboutDialog: ReactNode;
} {
  const [open, setOpen] = useState(false);

  const openAbout = () => {
    setOpen(true);
  };

  const aboutDialog = <AboutDialog open={open} onClose={() => setOpen(false)} />;

  return { openAbout, aboutDialog };
}
