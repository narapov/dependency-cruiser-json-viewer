import { useEffect, useRef, type MutableRefObject } from 'react';

import type { SerializedLayoutCache } from '../../../../types';
import { deserializeLayoutCache, legacyPositionsToLayouts, type LayoutCache } from '../../helpers';

interface GraphLayoutSnapshot {
  nodeLayouts: SerializedLayoutCache;
}

interface UseApplyWorkspaceLayoutInput {
  autoLayoutOnly: boolean;
  nodeLayouts: SerializedLayoutCache | null;
  nodePositions: Record<string, Record<string, { x: number; y: number } | undefined>> | null;
  layoutCacheRef: MutableRefObject<LayoutCache>;
  setLayoutSnapshot: (snapshot: GraphLayoutSnapshot) => void;
  requestRebuild: () => void;
}

/**
 * Applies workspace-persisted layouts into the live layout cache and requests a rebuild when they change.
 */
export function useApplyWorkspaceLayout(config: UseApplyWorkspaceLayoutInput): void {
  const { autoLayoutOnly, nodeLayouts, nodePositions, layoutCacheRef, setLayoutSnapshot, requestRebuild } = config;

  const layoutApplyKey = `${autoLayoutOnly}\0${JSON.stringify(nodeLayouts ?? nodePositions)}`;
  const lastAppliedLayoutKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastAppliedLayoutKeyRef.current === layoutApplyKey) {
      return;
    }
    lastAppliedLayoutKeyRef.current = layoutApplyKey;
    const resolvedLayouts: SerializedLayoutCache =
      nodeLayouts && Object.keys(nodeLayouts).length > 0 ? nodeLayouts : legacyPositionsToLayouts(nodePositions);
    layoutCacheRef.current = deserializeLayoutCache(resolvedLayouts);
    setLayoutSnapshot({ nodeLayouts: resolvedLayouts });
    requestRebuild();
  }, [layoutApplyKey, layoutCacheRef, nodeLayouts, nodePositions, requestRebuild, setLayoutSnapshot]);
}
