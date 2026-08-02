import { useEffect, useRef } from 'react';

import { useReactFlow, type Node } from '@xyflow/react';

import type { BuildGraphResult } from '../../types';

interface UsePendingFocusNodeInput {
  isBuildingGraph: boolean;
  graphResult: BuildGraphResult;
  layoutNodes: Node[];
}

interface UsePendingFocusNodeResult {
  focusNode: (path: string) => void;
}

/**
 * Focuses a graph node immediately when it exists in React Flow, or queues
 * focus until after an async ELK rebuild applies the node.
 */
export function usePendingFocusNode({
  isBuildingGraph,
  graphResult,
  layoutNodes,
}: UsePendingFocusNodeInput): UsePendingFocusNodeResult {
  const { fitView, getNode } = useReactFlow();
  const pendingFocusPathRef = useRef<string | null>(null);

  const runFitView = (path: string) => {
    void fitView({ nodes: [{ id: path }], padding: 0.5, duration: 300 });
  };

  const focusNode = (path: string) => {
    if (getNode(path)) {
      pendingFocusPathRef.current = null;
      runFitView(path);
      return;
    }
    pendingFocusPathRef.current = path;
  };

  useEffect(() => {
    const path = pendingFocusPathRef.current;
    if (path == null || isBuildingGraph) {
      return;
    }

    const inLayout = layoutNodes.some(node => node.id === path);
    if (inLayout) {
      // Wait for React Flow to measure a just-added node before fitting.
      const timeoutId = setTimeout(() => {
        if (pendingFocusPathRef.current !== path) {
          return;
        }
        pendingFocusPathRef.current = null;
        void fitView({ nodes: [{ id: path }], padding: 0.5, duration: 300 });
      }, 100);

      return () => {
        clearTimeout(timeoutId);
      };
    }

    const inResult = graphResult.nodes.some(node => node.id === path);
    if (!inResult) {
      // Build finished without this node — it will not appear.
      pendingFocusPathRef.current = null;
    }
  }, [isBuildingGraph, graphResult, layoutNodes, fitView]);

  return { focusNode };
}
