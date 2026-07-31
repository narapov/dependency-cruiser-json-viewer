import { useEffect, useRef } from 'react';

import { useReactFlow } from '@xyflow/react';

interface UseAutoFitViewInput {
  selectedPaths: string[];
  layoutNodesLength: number;
  hasUserLayout: boolean;
  autoLayoutOnly: boolean;
}

export function useAutoFitView({
  selectedPaths,
  layoutNodesLength,
  hasUserLayout,
  autoLayoutOnly,
}: UseAutoFitViewInput): void {
  const { fitView } = useReactFlow();
  const selectedPathsKey = selectedPaths.join('\0');
  const prevSelectedPathsKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (layoutNodesLength === 0 || hasUserLayout || autoLayoutOnly) return;

    const isInitialLayout = prevSelectedPathsKeyRef.current === null;
    const selectionChanged = prevSelectedPathsKeyRef.current !== selectedPathsKey;

    if (isInitialLayout || selectionChanged) {
      void fitView({ padding: 0.2, duration: 300 });
    }

    prevSelectedPathsKeyRef.current = selectedPathsKey;
  }, [selectedPathsKey, hasUserLayout, autoLayoutOnly, layoutNodesLength, fitView]);
}
