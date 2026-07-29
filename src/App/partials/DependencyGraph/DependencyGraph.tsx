import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import { useColorScheme, useTheme } from '@mui/material/styles';
import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import type { IModule } from 'dependency-cruiser';

import {
  applyActivePathEdgeStyle,
  applyActivePathNodeHighlight,
  applySelectedEdgeStyle,
  applyUserEdgeHighlightStyle,
  assignFolderColors,
  buildEdgeDependencyKeyMap,
  buildGraph,
  collectValidDependencyKeys,
  getEdgeHighlightColor,
  getMinimapNodeColor,
} from './helpers';
import { useEdgeContextMenu, useGraphLayoutNodes } from './hooks';
import { DependencyEdge } from './partials/DependencyEdge';
import { FileNode } from './partials/FileNode';
import { FolderGroupNode } from './partials/FolderGroupNode';
import { FolderNode } from './partials/FolderNode';
import { GraphLayoutToggle } from './partials/GraphLayoutToggle';
import { GraphLegend } from './partials/GraphLegend';
import type { BuildGraphResult, DependencyGraphHandle } from './types';

import styles from './DependencyGraph.module.css';

const nodeTypes = {
  folder: FolderNode,
  folderGroup: FolderGroupNode,
  file: FileNode,
};

const edgeTypes = {
  dependency: DependencyEdge,
};

const EMPTY_GRAPH_RESULT: BuildGraphResult = {
  nodes: [],
  edges: [],
  visibleNodeIds: new Set(),
  parentByNode: new Map(),
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
  const { fitView, getNode } = useReactFlow();
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [userEdgeHighlights, setUserEdgeHighlights] = useState<ReadonlyMap<string, string>>(() => new Map());

  const sources = modules.map(module => module.source);
  const colorMode = resolvedMode ?? 'light';
  const folderColors = useMemo(() => assignFolderColors(sources, colorMode), [sources, colorMode]);
  const expandedFolders = useMemo(() => new Set(expandedKeys), [expandedKeys]);

  const [graphResult, setGraphResult] = useState<BuildGraphResult>(EMPTY_GRAPH_RESULT);

  useEffect(() => {
    let cancelled = false;

    void buildGraph({
      modules,
      selectedPaths,
      expandedFolders,
      folderColors,
      onToggleFolder,
      onExpandRecursive,
      onShowInFileTree,
      onShowDependencies,
    }).then(result => {
      if (!cancelled) setGraphResult(result);
    });

    return () => {
      cancelled = true;
    };
  }, [
    modules,
    selectedPaths,
    expandedFolders,
    folderColors,
    onToggleFolder,
    onExpandRecursive,
    onShowInFileTree,
    onShowDependencies,
  ]);

  const {
    nodes: layoutNodes,
    onNodesChange,
    onNodeDrag,
    onNodeDragStop,
    onAutoLayoutGroup,
    onAutoLayoutGroupRecursive,
    hasUserLayout,
  } = useGraphLayoutNodes({
    graphResult,
    autoLayoutOnly,
  });

  const { edges: baseEdges, visibleNodeIds } = graphResult;

  const displayNodes = useMemo(() => {
    const nodesWithAutoLayout = layoutNodes.map(node => {
      const withCallbacks =
        !autoLayoutOnly && node.type === 'folderGroup'
          ? { ...node, data: { ...node.data, onAutoLayoutGroup, onAutoLayoutGroupRecursive } }
          : node;

      return autoLayoutOnly ? { ...withCallbacks, draggable: false, dragHandle: undefined } : withCallbacks;
    });
    return applyActivePathNodeHighlight(nodesWithAutoLayout, activePath ?? null);
  }, [layoutNodes, autoLayoutOnly, onAutoLayoutGroup, onAutoLayoutGroupRecursive, activePath]);

  const selectedPathsKey = selectedPaths.join('\0');
  const prevSelectedPathsKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (layoutNodes.length === 0 || hasUserLayout || autoLayoutOnly) return;

    const isInitialLayout = prevSelectedPathsKeyRef.current === null;
    const selectionChanged = prevSelectedPathsKeyRef.current !== selectedPathsKey;

    if (isInitialLayout || selectionChanged) {
      void fitView({ padding: 0.2, duration: 300 });
    }

    prevSelectedPathsKeyRef.current = selectedPathsKey;
  }, [selectedPathsKey, hasUserLayout, autoLayoutOnly, layoutNodes.length, fitView]);

  const activeEdgeId =
    selectedEdgeId != null && baseEdges.some(edge => edge.id === selectedEdgeId) ? selectedEdgeId : null;

  const edgeDependencyKeyMap = useMemo(
    () => buildEdgeDependencyKeyMap(modules, selectedPaths, expandedFolders, visibleNodeIds, baseEdges),
    [modules, selectedPaths, expandedFolders, visibleNodeIds, baseEdges],
  );

  const validDependencyKeys = useMemo(
    () => collectValidDependencyKeys(modules, selectedPaths),
    [modules, selectedPaths],
  );

  const effectiveUserEdgeHighlights = useMemo(() => {
    const next = new Map<string, string>();
    for (const [key, color] of userEdgeHighlights) {
      if (validDependencyKeys.has(key)) {
        next.set(key, color);
      }
    }
    return next;
  }, [userEdgeHighlights, validDependencyKeys]);

  const displayEdges = applyUserEdgeHighlightStyle(
    applySelectedEdgeStyle(applyActivePathEdgeStyle(baseEdges, activePath ?? null), activeEdgeId),
    effectiveUserEdgeHighlights,
    edgeDependencyKeyMap,
  );

  const setUserEdgeHighlight = useCallback(
    (edgeId: string, color: string | null) => {
      const dependencyKeys = edgeDependencyKeyMap.get(edgeId) ?? [];
      if (dependencyKeys.length === 0) return;

      setUserEdgeHighlights(prev => {
        const next = new Map(prev);
        for (const key of dependencyKeys) {
          if (color == null) {
            next.delete(key);
          } else {
            next.set(key, color);
          }
        }
        return next;
      });
    },
    [edgeDependencyKeyMap],
  );

  const getEdgeHighlight = useCallback(
    (edgeId: string) => {
      const dependencyKeys = edgeDependencyKeyMap.get(edgeId) ?? [];
      return getEdgeHighlightColor(dependencyKeys, effectiveUserEdgeHighlights);
    },
    [edgeDependencyKeyMap, effectiveUserEdgeHighlights],
  );

  const runFocusNode = (path: string) => {
    if (!getNode(path)) return;
    void fitView({ nodes: [{ id: path }], padding: 0.5, duration: 300 });
  };

  const { onEdgeContextMenu, edgeContextMenu } = useEdgeContextMenu({
    onFocusNode: runFocusNode,
    getEdgeHighlight,
    onSetUserEdgeHighlight: setUserEdgeHighlight,
  });

  useImperativeHandle(imperativeRef, () => ({
    focusNode(path: string) {
      runFocusNode(path);
    },
    clearAllHighlights() {
      setUserEdgeHighlights(new Map());
    },
  }));

  const onEdgeClick = (_: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id);
  };

  const onPaneClick = () => {
    setSelectedEdgeId(null);
  };

  const onPaneContextMenu = (event: React.MouseEvent | MouseEvent) => {
    event.preventDefault();
  };

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedEdgeId(null);
    if (activePath === node.id) {
      return;
    }
    onActivePathChange?.(node.id);
  };

  const miniMapNodeColor = (graphNode: Node) => getMinimapNodeColor(graphNode, colorMode);

  if (selectedPaths.length === 0) {
    return (
      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          height: '100%',
          color: 'text.secondary',
          fontSize: 14,
        }}
      >
        {t('graph.emptySelection')}
      </Box>
    );
  }

  return (
    <>
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
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
          style={{ width: 160, height: 120 }}
        />
        <Controls position="bottom-right" showInteractive={false} />
      </ReactFlow>
      {edgeContextMenu}
    </>
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
    <div className={`${styles.container}${autoLayoutOnly ? ` ${styles.layoutLocked}` : ''}`}>
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
