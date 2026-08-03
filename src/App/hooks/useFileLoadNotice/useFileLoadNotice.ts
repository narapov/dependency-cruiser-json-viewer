import { useState } from 'react';

/** Snackbar/alert state for file load errors. */
export function useFileLoadNotice() {
  const [fileLoadError, setFileLoadError] = useState<string | null>(null);

  const clearFileLoadError = () => {
    setFileLoadError(null);
  };

  return {
    fileLoadError,
    setFileLoadError,
    clearFileLoadError,
  };
}
