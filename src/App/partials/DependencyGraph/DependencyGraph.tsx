import clsx from 'clsx';
import type { IModule } from 'dependency-cruiser';
import { useImperativeHandle, useState, type MouseEvent as ReactMouseEvent, type Ref } from 'react';
import { useTranslation } from 'react-i18next';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import { useColorScheme, useTheme } from '@mui/material/styles';
import { Background, Controls, MiniMap, Panel, ReactFlow, ReactFlowProvider, type Node } from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { getMinimapNodeColor } from './helpers';
import {
  useAutoFitView,
  useBuildGraph,
  useEdgeContextMenu,
  useGraphLayoutNodes,
  useHighlightedEdges,
  useHighlightedNodes,
  usePendingFocusNode,
} from './hooks';
import { DependencyEdge } from './partials/DependencyEdge';
import { FileNode } from './partials/FileNode';
import { FolderGroupNode } from './partials/FolderGroupNode';
import { FolderNode } from './partials/FolderNode';
import { GraphEmptySelection } from './partials/GraphEmptySelection';
import { GraphLayoutToggle } from './partials/GraphLayoutToggle';
import { GraphLegend } from './partials/GraphLegend';
import { GraphLoader } from './partials/GraphLoader';
import type { DependencyGraphHandle } from './types';

import styles from './DependencyGraph.module.css';

const nodeTypes = {
  folder: FolderNode,
  folderGroup: FolderGroupNode,
  file: FileNode,
};

const edgeTypes = {
  dependency: DependencyEdge,
};

interface DependencyGraphInnerProps {
  imperativeRef?: Ref<DependencyGraphHandle>;
  modules: IModule[];
  selectedPaths: string[];
  expandedKeys: string[];
  onToggleFolder: (path: string) => void;
  onExpandRecursive: (path: string) => void;
  onShowInFileTree: (path: string) => void;
  onShowDependencies?: (path: string) => void;
  onActivePathChange?: (path: string) => void;
  activePath?: string | null;
  autoLayoutOnly: boolean;
  onAutoLayoutOnlyChange: (value: boolean) => void;
}

function DependencyGraphInner({
  imperativeRef,
  modules,
  selectedPaths,
  expandedKeys,
  onToggleFolder,
  onExpandRecursive,
  onShowInFileTree,
  onShowDependencies,
  onActivePathChange,
  activePath,
  autoLayoutOnly,
  onAutoLayoutOnlyChange,
}: DependencyGraphInnerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { mode, systemMode } = useColorScheme();
  const resolvedMode = mode === 'system' ? systemMode : mode;

  const colorMode = resolvedMode ?? 'light';

  const { graphResult, isBuildingGraph, buildFailed, clearBuildFailed, expandedFolders } = useBuildGraph({
    modules,
    selectedPaths,
    expandedKeys,
    colorMode,
    onToggleFolder,
    onExpandRecursive,
    onShowInFileTree,
    onShowDependencies,
  });

  const {
    nodes: layoutNodes,
    onNodesChange,
    onNodeDrag,
    onNodeDragStop,
    hasUserLayout,
  } = useGraphLayoutNodes({
    graphResult,
    autoLayoutOnly,
  });

  const { edges: baseEdges, visibleNodeIds } = graphResult;

  const { highlightedNodes } = useHighlightedNodes({
    nodes: layoutNodes,
    activePath,
  });

  const {
    highlightedEdges,
    getEdgeHighlight,
    setUserEdgeHighlight,
    clearAllHighlights,
    onEdgeClick,
    clearSelectedEdge,
  } = useHighlightedEdges({
    modules,
    selectedPaths,
    expandedFolders,
    baseEdges,
    visibleNodeIds,
    activePath,
  });

  useAutoFitView({
    selectedPaths,
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

  useImperativeHandle(imperativeRef, () => ({
    focusNode,
    clearAllHighlights,
  }));

  const onPaneClick = () => {
    clearSelectedEdge();
  };

  const onPaneContextMenu = (event: ReactMouseEvent | MouseEvent) => {
    event.preventDefault();
  };

  const onNodeClick = (_: ReactMouseEvent, node: Node) => {
    clearSelectedEdge();
    if (activePath === node.id) {
      return;
    }
    onActivePathChange?.(node.id);
  };

  const miniMapNodeColor = (graphNode: Node) => getMinimapNodeColor(graphNode, colorMode);

  if (selectedPaths.length === 0) {
    return <GraphEmptySelection />;
  }

  return (
    <Box sx={{ position: 'relative', height: '100%', minHeight: 0 }}>
      <ReactFlow
        nodes={highlightedNodes}
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
        proOptions={{ hideAttribution: true }}
      >
        <Background color={theme.palette.divider} />
        <Panel position="top-right">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mr: 1 }}>
            <GraphLayoutToggle checked={autoLayoutOnly} onChange={onAutoLayoutOnlyChange} />
            <GraphLegend />
          </Box>
        </Panel>
        <MiniMap
          position="bottom-left"
          pannable
          zoomable
          nodeColor={miniMapNodeColor}
          nodeStrokeColor={resolvedMode === 'dark' ? theme.palette.grey[600] : theme.palette.grey[500]}
          nodeStrokeWidth={1}
          maskStrokeColor={resolvedMode === 'dark' ? theme.palette.common.white : theme.palette.common.black}
          maskStrokeWidth={2}
          style={{ width: 160, height: 120 }}
        />
        <Controls position="bottom-right" showInteractive={false} />
      </ReactFlow>
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

interface DependencyGraphProps extends Omit<
  DependencyGraphInnerProps,
  'imperativeRef' | 'autoLayoutOnly' | 'onAutoLayoutOnlyChange'
> {
  ref?: Ref<DependencyGraphHandle>;
}

export function DependencyGraph({ ref, ...props }: DependencyGraphProps) {
  const [autoLayoutOnly, setAutoLayoutOnly] = useState(true);

  return (
    <div className={clsx(styles.container, autoLayoutOnly && styles.layoutLocked)}>
      <ReactFlowProvider>
        <DependencyGraphInner
          imperativeRef={ref}
          autoLayoutOnly={autoLayoutOnly}
          onAutoLayoutOnlyChange={setAutoLayoutOnly}
          {...props}
        />
      </ReactFlowProvider>
    </div>
  );
}
