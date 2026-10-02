import { useImperativeHandle, type Ref } from 'react';

import type { Edge, Node } from '@xyflow/react';

import type { GraphEdgesType } from '@/domain';
import { downloadTextFile, openGraphvizOnline } from '@/Shared';

import type { DependencyGraphHandle } from '../../../../types';
import { serializeGraphToDot } from '../../helpers';
import type { GraphLayoutSnapshot } from '../useCustomPositionedGraph';

interface UseDependencyGraphImperativeRefConfig {
  ref?: Ref<DependencyGraphHandle>;
  focusNode: (path: string) => void;
  selectEdge: (edgeId: string) => void;
  clearAllHighlights: () => void;
  layoutNodes: Node[];
  baseEdges: Edge[];
  userEdgeHighlights: ReadonlyMap<string, string>;
  autoLayoutOnly: boolean;
  edgesType: GraphEdgesType;
  getLayoutSnapshot: () => GraphLayoutSnapshot;
  openEdgesTypePicker: () => void;
}

/**
 * Exposes the DependencyGraph imperative API for App orchestration (focus, export, layout state).
 */
export function useDependencyGraphImperativeRef(config: UseDependencyGraphImperativeRefConfig): void {
  const {
    ref,
    focusNode,
    selectEdge,
    clearAllHighlights,
    layoutNodes,
    baseEdges,
    userEdgeHighlights,
    autoLayoutOnly,
    edgesType,
    getLayoutSnapshot,
    openEdgesTypePicker,
  } = config;

  useImperativeHandle(ref, () => {
    const buildDot = () =>
      serializeGraphToDot({
        nodes: layoutNodes,
        edges: baseEdges,
        userEdgeHighlights,
      });

    return {
      focusNode,
      selectEdge,
      clearAllHighlights,
      exportDot: () => {
        downloadTextFile('graph.dot', buildDot(), 'text/vnd.graphviz');
      },
      openDotOnline: () => {
        openGraphvizOnline(buildDot());
      },
      openEdgesTypePicker,
      getLayoutState: () => ({
        autoLayoutOnly,
        edgesType,
        nodeLayouts: getLayoutSnapshot().nodeLayouts,
      }),
    };
  });
}
