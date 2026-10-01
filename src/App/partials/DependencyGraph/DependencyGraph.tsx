import clsx from 'clsx';
import {
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type Ref,
} from 'react';
import { useTranslation } from 'react-i18next';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import { useColorScheme, useTheme } from '@mui/material/styles';
import { Background, Controls, MiniMap, Panel, ReactFlow, ReactFlowProvider, type Node } from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { downloadTextFile, openGraphvizOnline, useResolvedColorMode } from '@/Shared';

import { normalizeNodePositions, useWorkspaceStore } from '../../stores/workspaceStore';
import {
  deserializeLayoutCache,
  getMinimapNodeColor,
  serializeGraphToDot,
  serializeLayoutCache,
  toReactFlowEdges,
  type LayoutCache,
} from './helpers';
import {
  useAutoFitView,
  useBuildGraph,
  useEdgeContextMenu,
  useGraphLayoutNodes,
  useGraphWorkspaceActions,
  useHighlightedEdges,
  usePendingFocusNode,
  useThemedFolderColors,
} from './hooks';
import { DependencyEdge } from './partials/DependencyEdge';
import { EdgesTypePickerDialog } from './partials/EdgesTypePickerDialog';
import { FileNode } from './partials/FileNode';
import { FolderGroupNode } from './partials/FolderGroupNode';
import { FolderNode } from './partials/FolderNode';
import { GraphEmptySelection } from './partials/GraphEmptySelection';
import { GraphLayoutToggle } from './partials/GraphLayoutToggle';
import { GraphLegend } from './partials/GraphLegend';
import { GraphLoader } from './partials/GraphLoader';
import { GraphMarkers } from './partials/GraphMarkers';
import { NodeContextMenuControlsProvider, useNodeContextMenu } from './partials/NodeContextMenu';
import { useGraphMarkersStore } from './stores/graphMarkersStore';
import type { DependencyGraphHandle, GraphLayoutState, SerializedLayoutCache } from './types';

import styles from './DependencyGraph.module.css';

const nodeTypes = {
  folder: FolderNode,
  folderGroup: FolderGroupNode,
  file: FileNode,
};

const edgeTypes = {
  dependency: DependencyEdge,
};

function hasAnyPresent(record: Record<string, boolean | undefined>): boolean {
  return Object.values(record).some(present => present === true);
}

/** Converts legacy position-only maps into a serialized layout cache. */
function legacyPositionsToLayouts(
  nodePositions: Record<string, Record<string, { x: number; y: number } | undefined>> | null,
): SerializedLayoutCache {
  if (nodePositions == null) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(nodePositions).map(([groupId, children]) => [
      groupId,
      {
        id: groupId,
        children: Object.fromEntries(
          Object.entries(children)
            .filter((entry): entry is [string, { x: number; y: number }] => entry[1] != null)
            .map(([childId, position]) => [childId, { id: childId, position }]),
        ),
      },
    ]),
  );
}

/** Flattens group layouts back to legacy position maps for workspace persistence. */
function layoutsToLegacyPositions(nodeLayouts: SerializedLayoutCache): GraphLayoutState['nodePositions'] {
  return Object.fromEntries(
    Object.entries(nodeLayouts).map(([groupId, entry]) => [
      groupId,
      Object.fromEntries(Object.entries(entry.children).map(([childId, child]) => [childId, { ...child.position }])),
    ]),
  );
}

interface DependencyGraphInnerProps {
  imperativeRef?: Ref<DependencyGraphHandle>;
  onShowInFileTree: (path: string) => void;
  onViewModuleJson: (path: string) => void;
  onOpenEdgesTypePicker: () => void;
}

function DependencyGraphInner(props: DependencyGraphInnerProps) {
  const { imperativeRef, onShowInFileTree, onViewModuleJson, onOpenEdgesTypePicker } = props;

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

  const layoutApplyKey = `${autoLayoutOnly}\0${JSON.stringify(nodeLayouts ?? nodePositions)}`;
  const lastAppliedLayoutKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastAppliedLayoutKeyRef.current === layoutApplyKey) {
      return;
    }
    lastAppliedLayoutKeyRef.current = layoutApplyKey;
    const resolvedLayouts: SerializedLayoutCache =
      nodeLayouts != null && Object.keys(nodeLayouts).length > 0
        ? nodeLayouts
        : legacyPositionsToLayouts(nodePositions);
    layoutCacheRef.current = deserializeLayoutCache(resolvedLayouts);
    setLayoutSnapshot({ nodeLayouts: resolvedLayouts });
    requestRebuild();
  }, [layoutApplyKey, nodeLayouts, nodePositions, requestRebuild, setLayoutSnapshot]);

  const hasSelection = hasAnyPresent(selectedFilePaths);

  useEffect(() => {
    if (!hasSelection) {
      useGraphMarkersStore.getState().clearGraphMarkers();
    }
    return () => {
      useGraphMarkersStore.getState().clearGraphMarkers();
    };
  }, [hasSelection]);

  const baseEdges = toReactFlowEdges(graphResult.edges);

  const { highlightedEdges, getEdgeHighlight, setUserEdgeHighlight, onEdgeClick, selectEdge, clearSelectedEdge } =
    useHighlightedEdges({
      baseEdges,
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

  useImperativeHandle(imperativeRef, () => {
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
      openEdgesTypePicker: onOpenEdgesTypePicker,
      getLayoutState: () => ({
        autoLayoutOnly,
        edgesType,
        nodePositions: layoutsToLegacyPositions(getLayoutSnapshot().nodeLayouts),
        nodeLayouts: getLayoutSnapshot().nodeLayouts,
      }),
      setLayoutState: state => {
        setGraphSettings({ autoLayoutOnly: state.autoLayoutOnly, edgesType: state.edgesType });
        const layouts =
          state.nodeLayouts != null && Object.keys(state.nodeLayouts).length > 0
            ? state.nodeLayouts
            : legacyPositionsToLayouts(state.nodePositions);
        setNodePositions(normalizeNodePositions(layoutsToLegacyPositions(layouts)));
        setNodeLayouts(Object.keys(layouts).length > 0 ? layouts : null);
        setLayoutSnapshot({ nodeLayouts: layouts });
      },
    };
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

  if (!hasSelection) {
    return <GraphEmptySelection />;
  }

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

interface DependencyGraphProps {
  ref?: Ref<DependencyGraphHandle>;
  onShowInFileTree: (path: string) => void;
  onViewModuleJson: (path: string) => void;
}

export const DependencyGraph = memo(function DependencyGraph(props: DependencyGraphProps) {
  const { ref, onShowInFileTree, onViewModuleJson } = props;

  const autoLayoutOnly = useWorkspaceStore(state => state.graphSettings.autoLayoutOnly);
  const [edgesTypePickerOpen, setEdgesTypePickerOpen] = useState(false);

  return (
    <div className={clsx(styles.container, autoLayoutOnly && styles.layoutLocked)}>
      <ReactFlowProvider>
        <DependencyGraphInner
          imperativeRef={ref}
          onShowInFileTree={onShowInFileTree}
          onViewModuleJson={onViewModuleJson}
          onOpenEdgesTypePicker={() => setEdgesTypePickerOpen(true)}
        />
      </ReactFlowProvider>
      <EdgesTypePickerDialog open={edgesTypePickerOpen} onClose={() => setEdgesTypePickerOpen(false)} />
    </div>
  );
});
