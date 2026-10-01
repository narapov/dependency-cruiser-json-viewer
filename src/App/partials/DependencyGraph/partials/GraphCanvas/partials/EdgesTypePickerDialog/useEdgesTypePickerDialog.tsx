import { useState, type ReactNode } from 'react';

import { EdgesTypePickerDialog } from './EdgesTypePickerDialog';

/**
 * Owns edges-type picker open-state and returns the opener plus dialog node.
 */
export function useEdgesTypePickerDialog(): {
  openEdgesTypePicker: () => void;
  edgesTypePickerDialog: ReactNode;
} {
  const [open, setOpen] = useState(false);

  const openEdgesTypePicker = () => {
    setOpen(true);
  };

  const edgesTypePickerDialog = <EdgesTypePickerDialog open={open} onClose={() => setOpen(false)} />;

  return { openEdgesTypePicker, edgesTypePickerDialog };
}
