import { useEffect, useRef } from 'react';

import { useReactFlow } from '@xyflow/react';

import type { PresenceRecord } from '../../types';

interface UseAutoFitViewInput {
  selectedFilePaths: PresenceRecord;
  layoutNodesLength: number;
  hasUserLayout: boolean;
  autoLayoutOnly: boolean;
}

function selectedFilePathsKey(record: PresenceRecord): string {
  return Object.entries(record)
    .filter(([, present]) => present)
    .map(([path]) => path)
    .sort()
    .join('\0');
}

export function useAutoFitView(config: UseAutoFitViewInput): void {
  const { selectedFilePaths, layoutNodesLength, hasUserLayout, autoLayoutOnly } = config;

  const { fitView } = useReactFlow();
  const selectionKey = selectedFilePathsKey(selectedFilePaths);
  const prevSelectionKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (layoutNodesLength === 0 || hasUserLayout || autoLayoutOnly) {
      return;
    }

    const isInitialLayout = prevSelectionKeyRef.current === null;
    const selectionChanged = prevSelectionKeyRef.current !== selectionKey;

    if (isInitialLayout || selectionChanged) {
      void fitView({ padding: 0.2, duration: 300 });
    }

    prevSelectionKeyRef.current = selectionKey;
  }, [selectionKey, hasUserLayout, autoLayoutOnly, layoutNodesLength, fitView]);
}
