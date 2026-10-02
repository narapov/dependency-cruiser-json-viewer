import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import { useCounter } from 'react-use';

import type { SerializedLayoutCache } from '../../../../types';
import { deserializeLayoutCache, serializeLayoutCache, type LayoutCache } from '../../helpers';

interface UseLayoutCacheInput {
  autoLayoutOnly: boolean;
  nodeLayouts: SerializedLayoutCache | null;
}

interface UseLayoutCacheResult {
  layoutCacheRef: MutableRefObject<LayoutCache>;
  /** Bumped to force graph rebuild (workspace restore, auto-layout invalidate). */
  nodeLayoutsRevision: number;
  /** Bumped when drag commits so consumers re-derive from the mutated cache. */
  commitRevision: number;
  getLayoutCache: () => SerializedLayoutCache | undefined;
  requestRebuild: () => void;
  bumpCommitRevision: () => void;
}

/**
 * Owns the live layout cache, workspace restore, and revision counters for rebuild/commit.
 */
export function useLayoutCache(config: UseLayoutCacheInput): UseLayoutCacheResult {
  const { autoLayoutOnly, nodeLayouts } = config;

  const layoutCacheRef = useRef<LayoutCache>(new Map());
  const [nodeLayoutsRevision, { inc: bumpNodeLayoutsRevision }] = useCounter(0);
  const [commitRevision, { inc: bumpCommitRevision }] = useCounter(0);

  const layoutApplyKey = `${autoLayoutOnly}\0${JSON.stringify(nodeLayouts ?? {})}`;
  const lastAppliedLayoutKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastAppliedLayoutKeyRef.current === layoutApplyKey) {
      return;
    }
    lastAppliedLayoutKeyRef.current = layoutApplyKey;
    layoutCacheRef.current = deserializeLayoutCache(nodeLayouts ?? {});
    bumpNodeLayoutsRevision();
  }, [layoutApplyKey, nodeLayouts, bumpNodeLayoutsRevision]);

  const getLayoutCache = useCallback((): SerializedLayoutCache | undefined => {
    if (autoLayoutOnly) {
      return undefined;
    }
    return serializeLayoutCache(layoutCacheRef.current);
  }, [autoLayoutOnly]);

  return {
    layoutCacheRef,
    nodeLayoutsRevision,
    commitRevision,
    getLayoutCache,
    requestRebuild: bumpNodeLayoutsRevision,
    bumpCommitRevision,
  };
}
