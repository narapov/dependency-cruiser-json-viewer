import { useState } from 'react';

type HighlightEdgeStep = 'source' | 'target' | 'color';

/** Step and selection state for the Highlight Edge dialog (fresh instance per open). */
export function useHighlightEdgeDialogState() {
  const [step, setStep] = useState<HighlightEdgeStep>('source');
  const [sourcePath, setSourcePath] = useState<string | null>(null);
  const [targetPath, setTargetPath] = useState<string | null>(null);

  const selectSource = (path: string) => {
    setSourcePath(path);
    setTargetPath(null);
    setStep('target');
  };

  const selectTarget = (path: string) => {
    setTargetPath(path);
    setStep('color');
  };

  return {
    step,
    sourcePath,
    targetPath,
    selectSource,
    selectTarget,
  };
}
