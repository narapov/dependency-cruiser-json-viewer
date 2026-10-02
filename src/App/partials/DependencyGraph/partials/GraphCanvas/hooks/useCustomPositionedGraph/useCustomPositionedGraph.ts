import { useCallback, useMemo, type MutableRefObject } from 'react';
import { usePrevious } from 'react-use';

import type { Edge } from '@xyflow/react';

import type { GraphEdgesType } from '@/domain';

import type { SerializedLayoutCache } from '../../../../types';
import {
  applyCacheGeometryToNodes,
  applyPositions,
  buildParentByNode,
  copyPositionedNodes,
  deserializeLayoutCache,
  invalidateGroupLayout,
  invalidateGroupLayoutRecursive,
  mergeVisibleGroupLayouts,
  serializeLayoutCache,
  toReactFlowEdges,
  type LayoutCache,
} from '../../helpers';
import type { BuildGraphResult, VisibleTreeLayoutedNode } from '../../types';
import { useLibavoidEdgeRouting } from '../useLibavoidEdgeRouting';

interface UseCustomPositionedGraphInput {
  graphResult: BuildGraphResult;
  layoutCacheRef: MutableRefObject<LayoutCache>;
  commitRevision: number;
  nodeLayoutsRevision: number;
  edgesType: GraphEdgesType;
  isDragging: boolean;
  autoLayoutOnly?: boolean;
  bumpCommitRevision: () => void;
  onRequestRebuild?: () => void;
}

export interface GraphLayoutSnapshot {
  nodeLayouts: SerializedLayoutCache;
}

interface UseCustomPositionedGraphResult {
  positionedNodes: Map<string, VisibleTreeLayoutedNode>;
  positionedTree: VisibleTreeLayoutedNode[];
  parentByNode: ReadonlyMap<string, string | null>;
  baseEdges: Edge[];
  routedEdges: Edge[];
  routingProgress: ReturnType<typeof useLibavoidEdgeRouting>['routingProgress'];
  hasUserLayout: boolean;
  applyNodePositionToCache: (
    path: string,
    position: { x: number; y: number },
    options?: { commit?: boolean },
  ) => Map<string, VisibleTreeLayoutedNode>;
  getLayoutSnapshot: () => GraphLayoutSnapshot;
  onAutoLayoutGroup: (groupId: string) => void;
  onAutoLayoutGroupRecursive: (groupId: string) => void;
}

/**
 * Derives a custom-positioned graph from build output + live cache; owns drag reflow into the cache.
 */
export function useCustomPositionedGraph(config: UseCustomPositionedGraphInput): UseCustomPositionedGraphResult {
  const {
    graphResult,
    layoutCacheRef,
    commitRevision,
    nodeLayoutsRevision,
    edgesType,
    isDragging,
    autoLayoutOnly = false,
    bumpCommitRevision,
    onRequestRebuild,
  } = config;

  /* eslint-disable react-hooks/refs -- live layout cache is intentionally read/mutated during render; revisions force re-derive */
  const prevTree = usePrevious(graphResult.tree);
  if (prevTree !== undefined && prevTree !== graphResult.tree && !autoLayoutOnly) {
    if (Object.keys(graphResult.visibleGroupLayouts).length > 0) {
      mergeVisibleGroupLayouts(layoutCacheRef.current, deserializeLayoutCache(graphResult.visibleGroupLayouts));
    }
  }

  const positionedTree = useMemo(() => [...graphResult.tree.values()], [graphResult.tree]);
  const parentByNode = useMemo(() => buildParentByNode(positionedTree), [positionedTree]);

  const positionedNodes = useMemo(() => {
    if (autoLayoutOnly) {
      return copyPositionedNodes(graphResult.nodes);
    }
    return applyCacheGeometryToNodes(graphResult.nodes, layoutCacheRef.current, parentByNode);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- commitRevision/nodeLayoutsRevision force re-read of mutated cache
  }, [autoLayoutOnly, commitRevision, graphResult.nodes, layoutCacheRef, nodeLayoutsRevision, parentByNode]);

  const hasUserLayout = useMemo(
    () => !autoLayoutOnly && layoutCacheRef.current.size > 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- commitRevision/nodeLayoutsRevision force re-read of mutated cache
    [autoLayoutOnly, commitRevision, layoutCacheRef, nodeLayoutsRevision],
  );
  /* eslint-enable react-hooks/refs */

  const baseEdges = useMemo(
    () => toReactFlowEdges(graphResult.edges, graphResult.edgesPorts),
    [graphResult.edges, graphResult.edgesPorts],
  );

  const { routedEdges, routingProgress } = useLibavoidEdgeRouting({
    edgesType,
    layoutedTree: positionedTree,
    positionedNodes,
    edges: baseEdges,
    isDragging,
  });

  const applyNodePositionToCache = useCallback(
    (path: string, position: { x: number; y: number }, options?: { commit?: boolean }) => {
      if (autoLayoutOnly) {
        return applyCacheGeometryToNodes(graphResult.nodes, layoutCacheRef.current, parentByNode);
      }

      const current = applyCacheGeometryToNodes(graphResult.nodes, layoutCacheRef.current, parentByNode);
      const next = applyPositions(current, parentByNode, new Map([[path, { path, position }]]), {
        commitToCache: true,
        cache: layoutCacheRef.current,
      });

      if (options?.commit) {
        bumpCommitRevision();
      }

      return next;
    },
    [autoLayoutOnly, bumpCommitRevision, graphResult.nodes, layoutCacheRef, parentByNode],
  );

  const getLayoutSnapshot = useCallback((): GraphLayoutSnapshot => {
    return { nodeLayouts: serializeLayoutCache(layoutCacheRef.current) };
  }, [layoutCacheRef]);

  const onAutoLayoutGroup = useCallback(
    (groupId: string) => {
      invalidateGroupLayout(layoutCacheRef.current, groupId);
      onRequestRebuild?.();
    },
    [layoutCacheRef, onRequestRebuild],
  );

  const onAutoLayoutGroupRecursive = useCallback(
    (groupId: string) => {
      invalidateGroupLayoutRecursive(layoutCacheRef.current, groupId);
      onRequestRebuild?.();
    },
    [layoutCacheRef, onRequestRebuild],
  );

  return {
    positionedNodes,
    positionedTree,
    parentByNode,
    baseEdges,
    routedEdges,
    routingProgress,
    hasUserLayout,
    applyNodePositionToCache,
    getLayoutSnapshot,
    onAutoLayoutGroup,
    onAutoLayoutGroupRecursive,
  };
}
