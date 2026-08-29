import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useNodesState, type Node, type NodeChange, type OnNodeDrag } from '@xyflow/react';

import {
  applyAutoLayoutGroupLevel,
  applyAutoLayoutSubtree,
  applyPositionCache,
  buildGroupFingerprints,
  collectNodeSizes,
  compactAfterDrag,
  deserializePositionCache,
  invalidateGroupPositionCache,
  invalidateGroupPositionCacheRecursive,
  invalidatePositionCache,
  migrateReparentedNodePositions,
  preserveExpandedGroupPositions,
  reflowForDrag,
  reflowParentSiblings,
  serializePositionCache,
  updateGroupCacheFromNodes,
  updateGroupPositionCache,
  updateSubtreeGroupCaches,
  type GroupFingerprints,
  type NodeSize,
  type PositionCache,
} from '../../helpers';
import type { BuildGraphResult } from '../../types';

/**
 * Applies ELK-built graph nodes onto React Flow state with a position cache.
 *
 * Invariants:
 * - Fingerprints (`buildGroupFingerprints`) identify each group's direct children.
 *   When a group's fingerprint changes, its cached relative child positions are
 *   invalidated via `invalidatePositionCache`.
 * - `positionCacheRef` stores relative child positions per group. Cleared entirely
 *   when `autoLayoutOnly` is true (drag layout is disabled).
 * - On each `graphResult` change: optionally preserve expanded folder positions,
 *   apply cache, then `reflowParentSiblings` so grown/overlapping siblings push apart.
 * - Drag (`reflowForDrag` / `compactAfterDrag`) updates live positions and writes
 *   ancestor group caches on drag stop; `hasUserLayout` then suppresses auto fit-view.
 * - Manual "Auto layout" on a folder invalidates that group's cache (or subtree)
 *   and re-applies ELK layout for that scope before reflow.
 */
interface UseGraphLayoutNodesInput {
  graphResult: BuildGraphResult;
  autoLayoutOnly?: boolean;
}

export interface GraphLayoutSnapshot {
  nodePositions: Record<string, Record<string, { x: number; y: number }>>;
}

interface UseGraphLayoutNodesResult {
  nodes: Node[];
  onNodesChange: (changes: NodeChange[]) => void;
  onNodeDrag: OnNodeDrag<Node>;
  onNodeDragStop: OnNodeDrag<Node>;
  hasUserLayout: boolean;
  getLayoutSnapshot: () => GraphLayoutSnapshot;
  setLayoutSnapshot: (snapshot: GraphLayoutSnapshot) => void;
  onAutoLayoutGroup: (groupId: string) => void;
  onAutoLayoutGroupRecursive: (groupId: string) => void;
}

export function useGraphLayoutNodes({
  graphResult,
  autoLayoutOnly = false,
}: UseGraphLayoutNodesInput): UseGraphLayoutNodesResult {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const positionCacheRef = useRef<PositionCache>(new Map());
  const prevFingerprintsRef = useRef<GroupFingerprints | null>(null);
  const prevSizesRef = useRef<Map<string, NodeSize>>(new Map());
  const prevNodesRef = useRef<Node[] | null>(null);
  const prevParentByNodeRef = useRef<Map<string, string | null> | null>(null);
  const [hasUserLayout, setHasUserLayout] = useState(false);
  const [layoutSeed, setLayoutSeed] = useState(0);
  const pendingRestoreRef = useRef<GraphLayoutSnapshot | null>(null);
  const skipStaleGroupPurgeRef = useRef(false);

  useEffect(() => {
    if (!autoLayoutOnly) {
      return;
    }
    // Reset drag-layout flag when switching to auto layout only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasUserLayout(false);
  }, [autoLayoutOnly]);

  useEffect(() => {
    if (pendingRestoreRef.current != null) {
      if (graphResult.nodes.length === 0) {
        // Wait for the rebuilt graph; applying against an empty result would wipe the cache.
        setNodes([]);
        return;
      }
      positionCacheRef.current = deserializePositionCache(pendingRestoreRef.current.nodePositions);
      pendingRestoreRef.current = null;
      prevFingerprintsRef.current = null;
      prevSizesRef.current = new Map();
      prevNodesRef.current = null;
      prevParentByNodeRef.current = null;
      skipStaleGroupPurgeRef.current = true;
    }

    const { nodes: layoutNodes, parentByNode, visibleNodeIds } = graphResult;
    const nodeIds = new Set(layoutNodes.map(node => node.id));
    const currentFingerprints = buildGroupFingerprints(nodeIds, parentByNode);

    if (autoLayoutOnly) {
      positionCacheRef.current.clear();
    }

    if (skipStaleGroupPurgeRef.current) {
      skipStaleGroupPurgeRef.current = false;
    } else {
      invalidatePositionCache(
        positionCacheRef.current,
        currentFingerprints,
        prevFingerprintsRef.current,
        visibleNodeIds,
      );
    }

    let nextNodes = autoLayoutOnly ? layoutNodes : preserveExpandedGroupPositions(layoutNodes, prevNodesRef.current);

    if (!autoLayoutOnly) {
      nextNodes = migrateReparentedNodePositions(
        nextNodes,
        parentByNode,
        prevParentByNodeRef.current,
        prevNodesRef.current,
        positionCacheRef.current,
      );
      nextNodes = applyPositionCache(
        nextNodes,
        parentByNode,
        positionCacheRef.current,
        currentFingerprints,
        prevFingerprintsRef.current,
      );
    }

    nextNodes = reflowParentSiblings({
      nodes: nextNodes,
      parentByNode,
      previousSizes: prevSizesRef.current,
      cache: positionCacheRef.current,
      currentFingerprints,
      previousFingerprints: prevFingerprintsRef.current,
      previousNodes: prevNodesRef.current,
    });

    prevFingerprintsRef.current = currentFingerprints;
    prevSizesRef.current = collectNodeSizes(nextNodes);
    prevNodesRef.current = nextNodes;
    prevParentByNodeRef.current = new Map(parentByNode);
    setNodes(nextNodes);
  }, [autoLayoutOnly, graphResult, layoutSeed, setNodes]);

  const getLayoutSnapshot = useCallback((): GraphLayoutSnapshot => {
    return { nodePositions: serializePositionCache(positionCacheRef.current) };
  }, []);

  const setLayoutSnapshot = useCallback((snapshot: GraphLayoutSnapshot) => {
    pendingRestoreRef.current = snapshot;
    setHasUserLayout(Object.keys(snapshot.nodePositions).length > 0);
    setLayoutSeed(seed => seed + 1);
  }, []);

  const onNodeDrag = useCallback<OnNodeDrag<Node>>(
    (_, draggedNode) => {
      if (autoLayoutOnly) {
        return;
      }

      setNodes(currentNodes =>
        reflowForDrag(
          currentNodes,
          graphResult.parentByNode,
          draggedNode.id,
          draggedNode.position,
          prevSizesRef.current,
        ),
      );
    },
    [autoLayoutOnly, graphResult.parentByNode, setNodes],
  );

  const onNodeDragStop = useCallback<OnNodeDrag<Node>>(
    (_, draggedNode) => {
      if (autoLayoutOnly) {
        return;
      }

      setHasUserLayout(true);

      setNodes(currentNodes => {
        const reflowed = compactAfterDrag(
          reflowForDrag(
            currentNodes,
            graphResult.parentByNode,
            draggedNode.id,
            draggedNode.position,
            prevSizesRef.current,
          ),
          graphResult.parentByNode,
          draggedNode.id,
        );

        let groupId: string | null = draggedNode.parentId ?? null;
        while (true) {
          updateGroupCacheFromNodes(positionCacheRef.current, reflowed, graphResult.parentByNode, groupId);
          if (groupId === null) {
            break;
          }
          groupId = graphResult.parentByNode.get(groupId) ?? null;
        }

        prevSizesRef.current = collectNodeSizes(reflowed);
        return reflowed;
      });
    },
    [autoLayoutOnly, graphResult.parentByNode, setNodes],
  );

  const runAutoLayout = useCallback(
    (groupId: string, recursive: boolean) => {
      setNodes(currentNodes => {
        const { nodes: layoutNodes, parentByNode } = graphResult;
        const nodeIds = new Set(currentNodes.map(node => node.id));
        const currentFingerprints = buildGroupFingerprints(nodeIds, parentByNode);

        if (recursive) {
          invalidateGroupPositionCacheRecursive(positionCacheRef.current, groupId, currentNodes, parentByNode);
        } else {
          invalidateGroupPositionCache(positionCacheRef.current, groupId, parentByNode);
        }

        const layoutedNodes = recursive
          ? applyAutoLayoutSubtree(currentNodes, layoutNodes, groupId, parentByNode)
          : applyAutoLayoutGroupLevel(currentNodes, layoutNodes, groupId, parentByNode);

        const nextNodes = reflowParentSiblings({
          nodes: layoutedNodes,
          parentByNode,
          previousSizes: prevSizesRef.current,
          cache: positionCacheRef.current,
          currentFingerprints,
          previousFingerprints: currentFingerprints,
          previousNodes: currentNodes,
        });

        if (recursive) {
          updateSubtreeGroupCaches(positionCacheRef.current, nextNodes, parentByNode, groupId);
        } else {
          updateGroupPositionCache(positionCacheRef.current, nextNodes, parentByNode, groupId);
        }

        prevSizesRef.current = collectNodeSizes(nextNodes);
        prevNodesRef.current = nextNodes;
        prevParentByNodeRef.current = new Map(parentByNode);
        return nextNodes;
      });
    },
    [graphResult, setNodes],
  );

  const onAutoLayoutGroup = useCallback((groupId: string) => runAutoLayout(groupId, false), [runAutoLayout]);

  const onAutoLayoutGroupRecursive = useCallback((groupId: string) => runAutoLayout(groupId, true), [runAutoLayout]);

  const layoutNodes = useMemo(
    () => (autoLayoutOnly ? nodes.map(node => ({ ...node, draggable: false, dragHandle: undefined })) : nodes),
    [nodes, autoLayoutOnly],
  );

  return {
    nodes: layoutNodes,
    onNodesChange,
    onNodeDrag,
    onNodeDragStop,
    hasUserLayout,
    getLayoutSnapshot,
    setLayoutSnapshot,
    onAutoLayoutGroup,
    onAutoLayoutGroupRecursive,
  };
}
