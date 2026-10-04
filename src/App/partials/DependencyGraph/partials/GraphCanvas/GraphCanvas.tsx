import { useState, type MouseEvent as ReactMouseEvent, type Ref } from 'react';
import { useTranslation } from 'react-i18next';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import { useColorScheme, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { Background, Controls, MiniMap, Panel, ReactFlow, type Node } from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { useResolvedColorMode } from '@/Shared';

import { useWorkspaceStore } from '../../../../stores/workspaceStore';
import type { DependencyGraphHandle } from '../../types';
import { getMinimapNodeColor, toReactFlowEdges } from './helpers';
import {
  useAutoFitView,
  useBuildGraph,
  useClearGraphMarkersOnEmptySelection,
  useCustomPositionedGraph,
  useDependencyGraphImperativeRef,
  useEdgeContextMenu,
  useGraphWorkspaceActions,
  useHighlightedEdges,
  useLayoutCache,
  usePendingFocusNode,
  useReactFlowGraph,
  useThemedFolderColors,
} from './hooks';
import { DependencyEdge } from './partials/DependencyEdge';
import { FileNode } from './partials/FileNode';
import { FolderGroupNode } from './partials/FolderGroupNode';
import { FolderNode } from './partials/FolderNode';
import { GraphLayoutToggle } from './partials/GraphLayoutToggle';
import { GraphLegend } from './partials/GraphLegend';
import { GraphLoader } from './partials/GraphLoader';
import { GraphMarkers } from './partials/GraphMarkers';
import { NodeContextMenuControlsProvider, useNodeContextMenu } from './partials/NodeContextMenu';

const nodeTypes = {
  folder: FolderNode,
  folderGroup: FolderGroupNode,
  file: FileNode,
};

const edgeTypes = {
  dependency: DependencyEdge,
};

interface GraphCanvasProps {
  ref?: Ref<DependencyGraphHandle>;
  onShowInFileTree: (path: string) => void;
  onViewModuleJson: (path: string) => void;
  promptFolderLevel: (paths: readonly string[]) => Promise<number | null>;
}

/**
 * React Flow canvas and graph orchestration; must render under ReactFlowProvider.
 */
export function GraphCanvas(props: GraphCanvasProps) {
  const { ref, onShowInFileTree, onViewModuleJson, promptFolderLevel } = props;

  const cruiseSnapshot = useWorkspaceStore(state => state.cruiseSnapshot);
  const selectedFilePaths = useWorkspaceStore(state => state.selectedFilePaths);
  const visibleTree = useWorkspaceStore(state => state.visibleTree);
  const folderBaseColors = useWorkspaceStore(state => state.folderBaseColors);
  const userEdgeHighlights = useWorkspaceStore(state => state.userEdgeHighlights);
  const setUserEdgeHighlights = useWorkspaceStore(state => state.setUserEdgeHighlights);
  const clearAllHighlights = useWorkspaceStore(state => state.clearAllHighlights);
  const graphSettings = useWorkspaceStore(state => state.graphSettings);
  const nodeLayouts = useWorkspaceStore(state => state.nodeLayouts);

  const { activatePath } = useGraphWorkspaceActions();

  const { t } = useTranslation();
  const theme = useTheme();
  const { mode } = useColorScheme();
  const colorMode = useResolvedColorMode();
  const folderColors = useThemedFolderColors(folderBaseColors, colorMode);

  const { autoLayoutOnly, edgesType } = graphSettings;

  const [isNodeDragging, setIsNodeDragging] = useState(false);

  const { layoutCacheRef, nodeLayoutsRevision, commitRevision, getLayoutCache, requestRebuild, bumpCommitRevision } =
    useLayoutCache({
      autoLayoutOnly,
      nodeLayouts,
    });

  const { graphResult, isBuildingGraph, buildFailed, clearBuildFailed } = useBuildGraph({
    cruiseSnapshot,
    selectedFilePaths,
    visibleTree,
    getLayoutCache,
    layoutRevision: nodeLayoutsRevision,
  });

  const {
    routableEdges,
    routingProgress,
    hasUserLayout,
    applyNodePositionToCache,
    getLayoutSnapshot,
    onAutoLayoutGroup,
    onAutoLayoutGroupRecursive,
    positionedNodes,
  } = useCustomPositionedGraph({
    graphResult,
    layoutCacheRef,
    commitRevision,
    nodeLayoutsRevision,
    edgesType,
    isDragging: isNodeDragging,
    autoLayoutOnly,
    bumpCommitRevision,
    onRequestRebuild: requestRebuild,
  });

  const rfEdges = toReactFlowEdges(routableEdges);

  const {
    nodes: layoutNodes,
    onNodesChange,
    onNodeDrag,
    onNodeDragStop,
  } = useReactFlowGraph({
    positionedNodes,
    cruiseSnapshot,
    folderColors,
    autoLayoutOnly,
    applyNodePositionToCache,
    setIsDragging: setIsNodeDragging,
  });

  useClearGraphMarkersOnEmptySelection();

  const { highlightedEdges, getEdgeHighlight, setUserEdgeHighlight, onEdgeClick, selectEdge, clearSelectedEdge } =
    useHighlightedEdges({
      baseEdges: rfEdges,
      userEdgeHighlights,
      onUserEdgeHighlightsChange: setUserEdgeHighlights,
    });

  useAutoFitView({
    selectedFilePaths,
    layoutNodesLength: layoutNodes.length,
    hasUserLayout,
    autoLayoutOnly,
  });

  const { focusNode } = usePendingFocusNode({
    isBuildingGraph,
    graphResult,
    layoutNodes,
  });

  const { onEdgeContextMenu, edgeContextMenu } = useEdgeContextMenu({
    onFocusNode: focusNode,
    getEdgeHighlight,
    onSetUserEdgeHighlight: setUserEdgeHighlight,
  });

  useDependencyGraphImperativeRef({
    ref,
    focusNode,
    selectEdge,
    clearAllHighlights,
    layoutNodes,
    baseEdges: rfEdges,
    userEdgeHighlights,
    autoLayoutOnly,
    edgesType,
    getLayoutSnapshot,
  });

  const onPaneClick = () => {
    clearSelectedEdge();
  };

  const onPaneContextMenu = (event: ReactMouseEvent | MouseEvent) => {
    event.preventDefault();
  };

  const onNodeClick = (_: ReactMouseEvent, node: Node) => {
    clearSelectedEdge();
    if (useWorkspaceStore.getState().activePath === node.id) {
      return;
    }
    activatePath(node.id);
  };

  const miniMapNodeColor = (graphNode: Node) => getMinimapNodeColor(graphNode, colorMode);

  const { openContextMenu, openAtElement, contextMenu } = useNodeContextMenu({
    onShowInFileTree,
    onViewModuleJson,
    promptFolderLevel,
    ...(autoLayoutOnly ? {} : { onAutoLayoutGroup, onAutoLayoutGroupRecursive }),
  });

  return (
    <Box sx={{ position: 'relative', height: '100%', minHeight: 0 }}>
      <NodeContextMenuControlsProvider value={{ openContextMenu, openAtElement }}>
        <ReactFlow
          nodes={layoutNodes}
          edges={highlightedEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          colorMode={mode ?? 'system'}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          onPaneContextMenu={onPaneContextMenu}
          onNodeContextMenu={onPaneContextMenu}
          onEdgeContextMenu={onEdgeContextMenu}
          onNodesChange={onNodesChange}
          onNodeDrag={autoLayoutOnly ? undefined : onNodeDrag}
          onNodeDragStop={autoLayoutOnly ? undefined : onNodeDragStop}
          nodesDraggable={!autoLayoutOnly}
          minZoom={0.01}
          maxZoom={20}
          onlyRenderVisibleElements
          elementsSelectable={false}
        >
          <Background color={theme.palette.divider} />
          <Panel position="top-right">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <GraphLayoutToggle />
              <GraphLegend />
            </Box>
          </Panel>
          {!!routingProgress && (
            <Panel position="top-center">
              <Box
                sx={{
                  minWidth: 240,
                  maxWidth: 360,
                  px: 1.5,
                  py: 1,
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  boxShadow: 1,
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  {routingProgress.phase === 'overlap'
                    ? t('graph.libavoidOverlapProgress')
                    : t('graph.libavoidRoutingProgress')}{' '}
                  ({routingProgress.completed}/{routingProgress.total})
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={
                    routingProgress.total === 0
                      ? 0
                      : Math.min(100, (routingProgress.completed / routingProgress.total) * 100)
                  }
                />
              </Box>
            </Panel>
          )}
          <MiniMap
            position="bottom-left"
            pannable
            zoomable
            nodeColor={miniMapNodeColor}
            nodeStrokeColor={colorMode === 'dark' ? theme.palette.grey[600] : theme.palette.grey[500]}
            nodeStrokeWidth={1}
            maskStrokeColor={colorMode === 'dark' ? theme.palette.common.white : theme.palette.common.black}
            maskStrokeWidth={2}
            style={{ width: 160, height: 120 }}
          />
          <Controls position="bottom-right" showInteractive={false} />
        </ReactFlow>
        <GraphMarkers />
        {contextMenu}
      </NodeContextMenuControlsProvider>
      {isBuildingGraph && <GraphLoader />}
      {edgeContextMenu}
      <Snackbar
        open={buildFailed}
        autoHideDuration={6000}
        onClose={clearBuildFailed}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={clearBuildFailed} sx={{ width: '100%' }}>
          {t('graph.buildError')}
        </Alert>
      </Snackbar>
    </Box>
  );
}
