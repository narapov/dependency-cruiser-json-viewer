import Box from '@mui/material/Box'
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react'
import { useColorScheme, useTheme } from '@mui/material/styles'
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
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { IModule } from 'dependency-cruiser'
import {
  applySelectedEdgeStyle,
  applyUserEdgeHighlightStyle,
  assignFolderColors,
  buildEdgeDependencyKeyMap,
  buildGraph,
  collectValidDependencyKeys,
  getEdgeHighlightColor,
} from './helpers'
import type { FolderGroupNodeData, FolderNodeData } from './DependencyGraph.types'
import type { DependencyGraphHandle } from './types'
import { DependencyEdge } from './partials/DependencyEdge'
import { FileNode } from './partials/FileNode'
import { FolderGroupNode } from './partials/FolderGroupNode'
import { FolderNode } from './partials/FolderNode'
import { GraphLegend } from './partials/GraphLegend'
import { useEdgeContextMenu } from './hooks'
import styles from './DependencyGraph.module.css'

const nodeTypes = {
  folder: FolderNode,
  folderGroup: FolderGroupNode,
  file: FileNode,
}

const edgeTypes = {
  dependency: DependencyEdge,
}

interface DependencyGraphInnerProps {
  imperativeRef?: Ref<DependencyGraphHandle>
  modules: IModule[]
  selectedPaths: string[]
  expandedKeys: string[]
  onToggleFolder: (path: string) => void
  onExpandRecursive: (path: string) => void
  onShowInFileTree: (path: string) => void
  onShowDependencies?: (path: string) => void
  onActivePathChange?: (path: string) => void
  activePath?: string | null
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
}: DependencyGraphInnerProps) {
  const theme = useTheme()
  const { mode, systemMode } = useColorScheme()
  const resolvedMode = mode === 'system' ? systemMode : mode
  const { fitView, getNode, getZoom } = useReactFlow()
  const prevExpandedKey = useRef<string | null>(null)
  const pendingFocusPath = useRef<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [userEdgeHighlights, setUserEdgeHighlights] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  )

  const sources = modules.map((module) => module.source)
  const colorMode = resolvedMode ?? 'light'
  const folderColors = useMemo(
    () => assignFolderColors(sources, colorMode),
    [sources, colorMode],
  )
  const expandedFolders = new Set(expandedKeys)

  const { nodes, edges } = buildGraph({
    modules,
    selectedPaths,
    expandedFolders,
    highlightedNodeId: activePath ?? null,
    folderColors,
    onToggleFolder,
    onExpandRecursive,
    onShowInFileTree,
    onShowDependencies,
  })

  const activeEdgeId =
    selectedEdgeId != null && edges.some((edge) => edge.id === selectedEdgeId)
      ? selectedEdgeId
      : null

  const edgeDependencyKeyMap = useMemo(
    () => buildEdgeDependencyKeyMap(modules, selectedPaths, expandedFolders, edges),
    [modules, selectedPaths, expandedFolders, edges],
  )

  const displayEdges = applyUserEdgeHighlightStyle(
    applySelectedEdgeStyle(edges, activeEdgeId),
    userEdgeHighlights,
    edgeDependencyKeyMap,
  )

  const setUserEdgeHighlight = useCallback(
    (edgeId: string, color: string | null) => {
      const dependencyKeys = edgeDependencyKeyMap.get(edgeId) ?? []
      if (dependencyKeys.length === 0) return

      setUserEdgeHighlights((prev) => {
        const next = new Map(prev)
        for (const key of dependencyKeys) {
          if (color == null) {
            next.delete(key)
          } else {
            next.set(key, color)
          }
        }
        return next
      })
    },
    [edgeDependencyKeyMap],
  )

  const getEdgeHighlight = useCallback(
    (edgeId: string) => {
      const dependencyKeys = edgeDependencyKeyMap.get(edgeId) ?? []
      return getEdgeHighlightColor(dependencyKeys, userEdgeHighlights)
    },
    [edgeDependencyKeyMap, userEdgeHighlights],
  )

  useEffect(() => {
    const validKeys = collectValidDependencyKeys(modules, selectedPaths)
    setUserEdgeHighlights((prev) => {
      let changed = false
      const next = new Map<string, string>()
      for (const [key, color] of prev) {
        if (validKeys.has(key)) {
          next.set(key, color)
        } else {
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [modules, selectedPaths])

  const selectionKey = selectedPaths.slice().sort().join('|')
  const expandedStructureKey = expandedKeys.slice().sort().join('|')

  const runFocusNode = (path: string) => {
    if (!getNode(path)) {
      pendingFocusPath.current = path
      return
    }
    pendingFocusPath.current = null
    fitView({ nodes: [{ id: path }], padding: 0.5, duration: 300 })
  }

  const { onEdgeContextMenu, edgeContextMenu } = useEdgeContextMenu({
    onFocusNode: runFocusNode,
    getEdgeHighlight,
    onSetUserEdgeHighlight: setUserEdgeHighlight,
  })

  useImperativeHandle(imperativeRef, () => ({
    focusNode(path: string) {
      requestAnimationFrame(() => runFocusNode(path))
    },
    clearAllHighlights() {
      setUserEdgeHighlights(new Map())
    },
  }))

  useEffect(() => {
    const path = pendingFocusPath.current
    if (!path || !getNode(path)) return

    pendingFocusPath.current = null
    const frame = requestAnimationFrame(() => {
      fitView({ nodes: [{ id: path }], padding: 0.5, duration: 300 })
    })
    return () => cancelAnimationFrame(frame)
  }, [nodes, fitView, getNode])

  useEffect(() => {
    if (nodes.length === 0) return

    const frame = requestAnimationFrame(() => {
      fitView({ padding: 0.2, duration: 200 })
    })
    return () => cancelAnimationFrame(frame)
  }, [selectionKey, nodes.length, fitView])

  useEffect(() => {
    if (prevExpandedKey.current === null) {
      prevExpandedKey.current = expandedStructureKey
      return
    }
    if (prevExpandedKey.current === expandedStructureKey) return
    prevExpandedKey.current = expandedStructureKey

    if (!activePath || !getNode(activePath)) return

    const zoom = getZoom()
    const frame = requestAnimationFrame(() => {
      fitView({
        nodes: [{ id: activePath }],
        minZoom: zoom,
        maxZoom: zoom,
        padding: 0.5,
        duration: 200,
      })
    })
    return () => cancelAnimationFrame(frame)
  }, [expandedStructureKey, activePath, nodes, fitView, getNode, getZoom])

  const onEdgeClick = (_: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id)
  }

  const onPaneClick = () => {
    setSelectedEdgeId(null)
  }

  const onPaneContextMenu = (event: React.MouseEvent | MouseEvent) => {
    event.preventDefault()
  }

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedEdgeId(null)
    if (activePath === node.id) {
      return
    }
    onActivePathChange?.(node.id)
  }

  const nodeColor = (node: Node) => {
    if (node.type === 'folderGroup') {
      return (node.data as FolderGroupNodeData).backgroundColor
    }
    if (node.type === 'folder') {
      return (node.data as FolderNodeData).backgroundColor
    }
    return theme.palette.background.paper
  }

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
        Select files or folders to view dependencies
      </Box>
    )
  }

  return (
    <>
      <ReactFlow
        nodes={nodes}
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
        nodesDraggable={false}
        minZoom={0.01}
        maxZoom={20}
        onlyRenderVisibleElements
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color={theme.palette.divider} />
        <Panel position="top-right">
          <GraphLegend />
        </Panel>
        <MiniMap
          position="bottom-left"
          pannable
          zoomable
          nodeColor={nodeColor}
          style={{ width: 160, height: 120 }}
        />
        <Controls position="bottom-right" showInteractive={false} />
      </ReactFlow>
      {edgeContextMenu}
    </>
  )
}

interface DependencyGraphProps extends Omit<DependencyGraphInnerProps, 'imperativeRef'> {
  ref?: Ref<DependencyGraphHandle>
}

export function DependencyGraph({ ref, ...props }: DependencyGraphProps) {
  return (
    <div className={styles.container}>
      <ReactFlowProvider>
        <DependencyGraphInner imperativeRef={ref} {...props} />
      </ReactFlowProvider>
    </div>
  )
}
