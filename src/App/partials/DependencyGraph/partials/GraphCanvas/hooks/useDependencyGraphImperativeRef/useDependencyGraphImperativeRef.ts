import { useImperativeHandle, type Ref } from 'react';

import type { Edge, Node } from '@xyflow/react';

import type { GraphEdgesType } from '@/domain';
import { downloadTextFile, openGraphvizOnline } from '@/Shared';

import { normalizeNodePositions } from '../../../../../../stores/workspaceStore';
import type { DependencyGraphHandle, SerializedLayoutCache } from '../../../../types';
import { layoutsToLegacyPositions, legacyPositionsToLayouts, serializeGraphToDot } from '../../helpers';
import type { GraphLayoutSnapshot } from '../useGraphLayoutNodes';

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
  setLayoutSnapshot: (snapshot: GraphLayoutSnapshot) => void;
  setGraphSettings: (settings: { autoLayoutOnly: boolean; edgesType: GraphEdgesType }) => void;
  setNodePositions: (
    nodePositions: Record<string, Record<string, { x: number; y: number } | undefined>> | null,
  ) => void;
  setNodeLayouts: (nodeLayouts: SerializedLayoutCache | null) => void;
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
    setLayoutSnapshot,
    setGraphSettings,
    setNodePositions,
    setNodeLayouts,
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
        nodePositions: layoutsToLegacyPositions(getLayoutSnapshot().nodeLayouts),
        nodeLayouts: getLayoutSnapshot().nodeLayouts,
      }),
      setLayoutState: state => {
        setGraphSettings({ autoLayoutOnly: state.autoLayoutOnly, edgesType: state.edgesType });
        const layouts =
          state.nodeLayouts && Object.keys(state.nodeLayouts).length > 0
            ? state.nodeLayouts
            : legacyPositionsToLayouts(state.nodePositions);
        setNodePositions(normalizeNodePositions(layoutsToLegacyPositions(layouts)));
        setNodeLayouts(Object.keys(layouts).length > 0 ? layouts : null);
        setLayoutSnapshot({ nodeLayouts: layouts });
      },
    };
  });
}
