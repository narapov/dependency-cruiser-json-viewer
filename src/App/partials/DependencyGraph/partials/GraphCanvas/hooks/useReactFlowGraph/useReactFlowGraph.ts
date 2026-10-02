import { useCallback, useEffect, useMemo, type Dispatch, type SetStateAction } from 'react';
import { useLatest } from 'react-use';

import { useNodesState, type Node, type NodeChange, type OnNodeDrag } from '@xyflow/react';

import type { CruiseSnapshot } from '@/domain';

import { layoutedMapToNodeChanges, toReactFlowNodes } from '../../helpers';
import type { VisibleTreeLayoutedNode } from '../../types';

interface UseReactFlowGraphInput {
  positionedNodes: ReadonlyMap<string, VisibleTreeLayoutedNode>;
  cruiseSnapshot: CruiseSnapshot;
  folderColors: ReadonlyMap<string, string>;
  autoLayoutOnly?: boolean;
  applyNodePositionToCache: (
    path: string,
    position: { x: number; y: number },
    options?: { commit?: boolean },
  ) => Map<string, VisibleTreeLayoutedNode>;
  setIsDragging: Dispatch<SetStateAction<boolean>>;
}

interface UseReactFlowGraphResult {
  nodes: Node[];
  onNodesChange: (changes: NodeChange[]) => void;
  onNodeDrag: OnNodeDrag<Node>;
  onNodeDragStop: OnNodeDrag<Node>;
}

/**
 * Projects custom-positioned graph geometry into React Flow and bridges drag via onNodesChange.
 */
export function useReactFlowGraph(config: UseReactFlowGraphInput): UseReactFlowGraphResult {
  const {
    positionedNodes,
    cruiseSnapshot,
    folderColors,
    autoLayoutOnly = false,
    applyNodePositionToCache,
    setIsDragging,
  } = config;

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const nodesRef = useLatest(nodes);

  useEffect(() => {
    const reactFlowGraph = toReactFlowNodes(positionedNodes, cruiseSnapshot, folderColors);
    setNodes(reactFlowGraph.nodes);
  }, [cruiseSnapshot, folderColors, positionedNodes, setNodes]);

  const layoutNodes = useMemo(
    () => (autoLayoutOnly ? nodes.map(node => ({ ...node, draggable: false, dragHandle: undefined })) : nodes),
    [nodes, autoLayoutOnly],
  );

  const onNodeDrag = useCallback<OnNodeDrag<Node>>(
    (_, draggedNode) => {
      if (autoLayoutOnly) {
        return;
      }

      setIsDragging(true);
      const reflowed = applyNodePositionToCache(draggedNode.id, draggedNode.position);
      // RF's 3rd onNodeDrag arg is only dragged items; compare against full node state.
      const changes = layoutedMapToNodeChanges(reflowed, nodesRef.current);
      if (changes.length > 0) {
        onNodesChange(changes);
      }
    },
    [applyNodePositionToCache, autoLayoutOnly, nodesRef, onNodesChange, setIsDragging],
  );

  const onNodeDragStop = useCallback<OnNodeDrag<Node>>(
    (_, draggedNode) => {
      if (autoLayoutOnly) {
        return;
      }

      applyNodePositionToCache(draggedNode.id, draggedNode.position, { commit: true });
      setIsDragging(false);
    },
    [applyNodePositionToCache, autoLayoutOnly, setIsDragging],
  );

  return {
    nodes: layoutNodes,
    onNodesChange,
    onNodeDrag,
    onNodeDragStop,
  };
}
