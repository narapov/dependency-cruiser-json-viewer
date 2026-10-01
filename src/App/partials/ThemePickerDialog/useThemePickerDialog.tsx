import { useState, type ReactNode } from 'react';

import { ThemePickerDialog } from './ThemePickerDialog';

/**
 * Owns theme picker open-state and returns the opener plus dialog node.
 */
export function useThemePickerDialog(): {
  openThemePicker: () => void;
  themePickerDialog: ReactNode;
} {
  const [open, setOpen] = useState(false);

  const openThemePicker = () => {
    setOpen(true);
  };

  const themePickerDialog = <ThemePickerDialog open={open} onClose={() => setOpen(false)} />;

  return { openThemePicker, themePickerDialog };
}
