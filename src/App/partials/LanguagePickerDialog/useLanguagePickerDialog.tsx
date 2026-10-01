import { useState, type ReactNode } from 'react';

import { LanguagePickerDialog } from './LanguagePickerDialog';

/**
 * Owns language picker open-state and returns the opener plus dialog node.
 */
export function useLanguagePickerDialog(): {
  openLanguagePicker: () => void;
  languagePickerDialog: ReactNode;
} {
  const [open, setOpen] = useState(false);

  const openLanguagePicker = () => {
    setOpen(true);
  };

  const languagePickerDialog = <LanguagePickerDialog open={open} onClose={() => setOpen(false)} />;

  return { openLanguagePicker, languagePickerDialog };
}
