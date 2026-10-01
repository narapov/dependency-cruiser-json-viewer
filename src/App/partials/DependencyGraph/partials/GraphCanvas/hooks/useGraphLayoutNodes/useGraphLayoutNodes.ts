import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';

import { useNodesState, type Node, type NodeChange, type OnNodeDrag } from '@xyflow/react';

import type { CruiseSnapshot } from '@/domain';

import type { SerializedLayoutCache } from '../../../../types';
import {
  deserializeLayoutCache,
  invalidateGroupLayout,
  invalidateGroupLayoutRecursive,
  mergeVisibleGroupLayouts,
  reflowDragPushDown,
  serializeLayoutCache,
  toReactFlowNodes,
  updateCacheFromReactFlowNodes,
  type LayoutCache,
} from '../../helpers';
import type { BuildGraphResult } from '../../types';

interface UseGraphLayoutNodesInput {
  graphResult: BuildGraphResult;
  cruiseSnapshot: CruiseSnapshot;
  folderColors: ReadonlyMap<string, string>;
  layoutCacheRef: MutableRefObject<LayoutCache>;
  autoLayoutOnly?: boolean;
  /** Bumps when auto-layout invalidates cache so the parent can rebuild. */
  onRequestRebuild?: () => void;
}

export interface GraphLayoutSnapshot {
  nodeLayouts: SerializedLayoutCache;
}

interface UseGraphLayoutNodesResult {
  nodes: Node[];
  parentByNode: ReadonlyMap<string, string | null>;
  onNodesChange: (changes: NodeChange[]) => void;
  onNodeDrag: OnNodeDrag<Node>;
  onNodeDragStop: OnNodeDrag<Node>;
  hasUserLayout: boolean;
  getLayoutSnapshot: () => GraphLayoutSnapshot;
  setLayoutSnapshot: (snapshot: GraphLayoutSnapshot) => void;
  onAutoLayoutGroup: (groupId: string) => void;
  onAutoLayoutGroupRecursive: (groupId: string) => void;
}

/**
 * Mirrors buildGraph geometry into React Flow and updates the shared layout cache.
 * Rebuild merge comes from `graphResult.visibleGroupLayouts`; DnD updates the cache in place.
 */
export function useGraphLayoutNodes(config: UseGraphLayoutNodesInput): UseGraphLayoutNodesResult {
  const {
    graphResult,
    cruiseSnapshot,
    folderColors,
    layoutCacheRef,
    autoLayoutOnly = false,
    onRequestRebuild,
  } = config;

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const parentByNodeRef = useRef<Map<string, string | null>>(new Map());
  const [hasUserLayout, setHasUserLayout] = useState(false);
  const pendingRestoreRef = useRef<SerializedLayoutCache | null>(null);

  useEffect(() => {
    if (!autoLayoutOnly) {
      return;
    }
    // Reset drag-layout flag when switching to auto layout only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasUserLayout(false);
  }, [autoLayoutOnly]);

  useEffect(() => {
    if (pendingRestoreRef.current) {
      layoutCacheRef.current = deserializeLayoutCache(pendingRestoreRef.current);
      pendingRestoreRef.current = null;
    }

    if (!autoLayoutOnly && Object.keys(graphResult.visibleGroupLayouts).length > 0) {
      mergeVisibleGroupLayouts(layoutCacheRef.current, deserializeLayoutCache(graphResult.visibleGroupLayouts));
    }

    const reactFlowGraph = toReactFlowNodes(graphResult.nodes, cruiseSnapshot, folderColors);
    parentByNodeRef.current = reactFlowGraph.parentByNode;
    setNodes(reactFlowGraph.nodes);
  }, [autoLayoutOnly, cruiseSnapshot, folderColors, graphResult, layoutCacheRef, setNodes]);

  const getLayoutSnapshot = useCallback((): GraphLayoutSnapshot => {
    return { nodeLayouts: serializeLayoutCache(layoutCacheRef.current) };
  }, [layoutCacheRef]);

  const setLayoutSnapshot = useCallback((snapshot: GraphLayoutSnapshot) => {
    pendingRestoreRef.current = snapshot.nodeLayouts;
    setHasUserLayout(Object.keys(snapshot.nodeLayouts).length > 0);
  }, []);

  const onNodeDrag = useCallback<OnNodeDrag<Node>>(
    (_, draggedNode) => {
      if (autoLayoutOnly) {
        return;
      }

      setNodes(currentNodes =>
        reflowDragPushDown(currentNodes, parentByNodeRef.current, draggedNode.id, draggedNode.position),
      );
    },
    [autoLayoutOnly, setNodes],
  );

  const onNodeDragStop = useCallback<OnNodeDrag<Node>>(
    (_, draggedNode) => {
      if (autoLayoutOnly) {
        return;
      }

      setHasUserLayout(true);
      setNodes(currentNodes => {
        const reflowed = reflowDragPushDown(
          currentNodes,
          parentByNodeRef.current,
          draggedNode.id,
          draggedNode.position,
        );
        updateCacheFromReactFlowNodes(layoutCacheRef.current, reflowed, parentByNodeRef.current, draggedNode.id);
        return reflowed;
      });
    },
    [autoLayoutOnly, layoutCacheRef, setNodes],
  );

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

  const layoutNodes = useMemo(
    () => (autoLayoutOnly ? nodes.map(node => ({ ...node, draggable: false, dragHandle: undefined })) : nodes),
    [nodes, autoLayoutOnly],
  );

  const parentByNode = useMemo(() => {
    const map = new Map<string, string | null>();
    nodes.forEach(node => {
      map.set(node.id, node.parentId ?? null);
    });
    return map;
  }, [nodes]);

  return {
    nodes: layoutNodes,
    parentByNode,
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
