import clsx from 'clsx';
import {
  memo,
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

import { downloadTextFile, openGraphvizOnline, useLogChangedProps, useResolvedColorMode } from '@/Shared';

import { normalizeNodePositions, useWorkspaceStore } from '../../stores/workspaceStore';
import { getMinimapNodeColor, serializeGraphToDot } from './helpers';
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
import { NodeContextMenuControlsProvider, useNodeContextMenu } from './partials/NodeContextMenu';
import type { DependencyGraphHandle, GraphLayoutState } from './types';

import styles from './DependencyGraph.module.css';

const nodeTypes = {
  folder: FolderNode,
  folderGroup: FolderGroupNode,
  file: FileNode,
};

const edgeTypes = {
  dependency: DependencyEdge,
};

function toGraphNodePositions(
  nodePositions: Record<string, Record<string, { x: number; y: number } | undefined>> | null,
): GraphLayoutState['nodePositions'] {
  if (nodePositions == null) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(nodePositions).map(([groupId, children]) => [
      groupId,
      Object.fromEntries(
        Object.entries(children).filter((entry): entry is [string, { x: number; y: number }] => entry[1] != null),
      ),
    ]),
  );
}

function hasAnyPresent(record: Record<string, boolean | undefined>): boolean {
  return Object.values(record).some(present => present === true);
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

  const { activatePath } = useGraphWorkspaceActions();

  const { t } = useTranslation();
  const theme = useTheme();
  const { mode } = useColorScheme();
  const colorMode = useResolvedColorMode();
  const folderColors = useThemedFolderColors(folderBaseColors, colorMode);

  const { autoLayoutOnly, edgesType } = graphSettings;

  const { graphResult, isBuildingGraph, buildFailed, clearBuildFailed } = useBuildGraph({
    cruiseSnapshot,
    selectedFilePaths,
    visibleTree,
    folderColors,
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
    autoLayoutOnly,
  });

  const layoutApplyKey = `${autoLayoutOnly}\0${edgesType}\0${JSON.stringify(nodePositions)}`;
  const lastAppliedLayoutKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastAppliedLayoutKeyRef.current === layoutApplyKey) {
      return;
    }
    lastAppliedLayoutKeyRef.current = layoutApplyKey;
    setLayoutSnapshot({ nodePositions: toGraphNodePositions(nodePositions) });
  }, [layoutApplyKey, nodePositions, setLayoutSnapshot]);

  const { edges: baseEdges } = graphResult;

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
        nodePositions: getLayoutSnapshot().nodePositions,
      }),
      setLayoutState: state => {
        setGraphSettings({ autoLayoutOnly: state.autoLayoutOnly, edgesType: state.edgesType });
        setNodePositions(normalizeNodePositions(state.nodePositions));
        setLayoutSnapshot({ nodePositions: state.nodePositions });
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

  useLogChangedProps('DependencyGraphInner', {
    imperativeRef,
    onShowInFileTree,
    onViewModuleJson,
    onOpenEdgesTypePicker,
    cruiseSnapshot,
    selectedFilePaths,
    visibleTree,
    folderBaseColors,
    userEdgeHighlights,
    setUserEdgeHighlights,
    clearAllHighlights,
    graphSettings,
    setGraphSettings,
    nodePositions,
    setNodePositions,
    activatePath,
    t,
    theme,
    mode,
    colorMode,
    folderColors,
    autoLayoutOnly,
    edgesType,
    graphResult,
    isBuildingGraph,
    buildFailed,
    clearBuildFailed,
    layoutNodes,
    onNodesChange,
    onNodeDrag,
    onNodeDragStop,
    hasUserLayout,
    getLayoutSnapshot,
    setLayoutSnapshot,
    onAutoLayoutGroup,
    onAutoLayoutGroupRecursive,
    layoutApplyKey,
    lastAppliedLayoutKeyRef,
    baseEdges,
    highlightedEdges,
    getEdgeHighlight,
    setUserEdgeHighlight,
    onEdgeClick,
    selectEdge,
    clearSelectedEdge,
    focusNode,
    onEdgeContextMenu,
    edgeContextMenu,
    onPaneClick,
    onPaneContextMenu,
    onNodeClick,
    miniMapNodeColor,
    openContextMenu,
    openAtElement,
    contextMenu,
  });

  if (!hasAnyPresent(selectedFilePaths)) {
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

  console.log('DependencyGraph rendered');
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
