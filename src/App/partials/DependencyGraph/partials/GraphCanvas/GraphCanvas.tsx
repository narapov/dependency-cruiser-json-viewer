import { useCallback, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type Ref } from 'react';
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
import type { DependencyGraphHandle, SerializedLayoutCache } from '../../types';
import { getMinimapNodeColor, serializeLayoutCache, toReactFlowEdges, type LayoutCache } from './helpers';
import {
  useApplyWorkspaceLayout,
  useAutoFitView,
  useBuildGraph,
  useClearGraphMarkersOnEmptySelection,
  useDependencyGraphImperativeRef,
  useEdgeContextMenu,
  useGraphLayoutNodes,
  useGraphWorkspaceActions,
  useHighlightedEdges,
  useLibavoidEdgeRouting,
  usePendingFocusNode,
  useThemedFolderColors,
} from './hooks';
import { DependencyEdge } from './partials/DependencyEdge';
import { useEdgesTypePickerDialog } from './partials/EdgesTypePickerDialog';
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
}

/**
 * React Flow canvas and graph orchestration; must render under ReactFlowProvider.
 */
export function GraphCanvas(props: GraphCanvasProps) {
  const { ref, onShowInFileTree, onViewModuleJson } = props;

  const { openEdgesTypePicker, edgesTypePickerDialog } = useEdgesTypePickerDialog();

  const cruiseSnapshot = useWorkspaceStore(state => state.cruiseSnapshot);
  const selectedFilePaths = useWorkspaceStore(state => state.selectedFilePaths);
  const visibleTree = useWorkspaceStore(state => state.visibleTree);
  const folderBaseColors = useWorkspaceStore(state => state.folderBaseColors);
  const userEdgeHighlights = useWorkspaceStore(state => state.userEdgeHighlights);
  const setUserEdgeHighlights = useWorkspaceStore(state => state.setUserEdgeHighlights);
  const clearAllHighlights = useWorkspaceStore(state => state.clearAllHighlights);
  const graphSettings = useWorkspaceStore(state => state.graphSettings);
  const setGraphSettings = useWorkspaceStore(state => state.setGraphSettings);
  const nodePositions = useWorkspaceStore(state => state.nodePositions);
  const setNodePositions = useWorkspaceStore(state => state.setNodePositions);
  const nodeLayouts = useWorkspaceStore(state => state.nodeLayouts);
  const setNodeLayouts = useWorkspaceStore(state => state.setNodeLayouts);

  const { activatePath } = useGraphWorkspaceActions();

  const { t } = useTranslation();
  const theme = useTheme();
  const { mode } = useColorScheme();
  const colorMode = useResolvedColorMode();
  const folderColors = useThemedFolderColors(folderBaseColors, colorMode);

  const { autoLayoutOnly, edgesType } = graphSettings;

  const layoutCacheRef = useRef<LayoutCache>(new Map());
  const [layoutRevision, setLayoutRevision] = useState(0);

  const getLayoutCache = useCallback((): SerializedLayoutCache | undefined => {
    if (autoLayoutOnly) {
      return undefined;
    }
    return serializeLayoutCache(layoutCacheRef.current);
  }, [autoLayoutOnly]);

  const requestRebuild = useCallback(() => {
    setLayoutRevision(revision => revision + 1);
  }, []);

  const { graphResult, isBuildingGraph, buildFailed, clearBuildFailed } = useBuildGraph({
    cruiseSnapshot,
    selectedFilePaths,
    visibleTree,
    getLayoutCache,
    layoutRevision,
  });

  const {
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
  } = useGraphLayoutNodes({
    graphResult,
    cruiseSnapshot,
    folderColors,
    layoutCacheRef,
    autoLayoutOnly,
    onRequestRebuild: requestRebuild,
  });

  const [isNodeDragging, setIsNodeDragging] = useState(false);

  const handleNodeDrag = useCallback(
    (...args: Parameters<typeof onNodeDrag>) => {
      setIsNodeDragging(true);
      onNodeDrag(...args);
    },
    [onNodeDrag],
  );

  const handleNodeDragStop = useCallback(
    (...args: Parameters<typeof onNodeDragStop>) => {
      setIsNodeDragging(false);
      onNodeDragStop(...args);
    },
    [onNodeDragStop],
  );

  useApplyWorkspaceLayout({
    autoLayoutOnly,
    nodeLayouts,
    nodePositions,
    layoutCacheRef,
    setLayoutSnapshot,
    requestRebuild,
  });

  useClearGraphMarkersOnEmptySelection();

  const baseEdges = useMemo(
    () => toReactFlowEdges(graphResult.edges, graphResult.edgePortsById),
    [graphResult.edges, graphResult.edgePortsById],
  );

  const { routedEdges, routingProgress } = useLibavoidEdgeRouting({
    edgesType,
    nodes: layoutNodes,
    edges: baseEdges,
    parentByNode,
    isDragging: isNodeDragging,
  });

  const { highlightedEdges, getEdgeHighlight, setUserEdgeHighlight, onEdgeClick, selectEdge, clearSelectedEdge } =
    useHighlightedEdges({
      baseEdges: routedEdges,
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
          onNodeDrag={autoLayoutOnly ? undefined : handleNodeDrag}
          onNodeDragStop={autoLayoutOnly ? undefined : handleNodeDragStop}
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
      {edgesTypePickerDialog}
    </Box>
  );
}
