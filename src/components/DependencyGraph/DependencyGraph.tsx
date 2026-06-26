import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { applySelectedEdgeStyle } from '../../lib/dependencyGraph/applySelectedEdgeStyle'
import { buildGraph } from '../../lib/dependencyGraph/buildGraph'
import type { FolderGroupNodeData, FolderNodeData } from '../../lib/dependencyGraph/types'
import { DependencyEdge } from './DependencyEdge'
import { FileNode } from './FileNode'
import { FolderGroupNode } from './FolderGroupNode'
import { FolderNode } from './FolderNode'
import { GraphLegend } from './GraphLegend'
import styles from './DependencyGraph.module.css'

const nodeTypes = {
  folder: FolderNode,
  folderGroup: FolderGroupNode,
  file: FileNode,
}

const edgeTypes = {
  dependency: DependencyEdge,
}

interface DependencyGraphProps {
  modules: IModule[]
  selectedPaths: string[]
  folderColors: ReadonlyMap<string, string>
  expandedKeys: string[]
  onToggleFolder: (path: string) => void
  onShowInFileTree: (path: string) => void
  onShowDependencies?: (path: string) => void
  onActivePathChange?: (path: string) => void
  activePath?: string | null
  graphFitToken?: number
}

function DependencyGraphInner({
  modules,
  selectedPaths,
  folderColors,
  expandedKeys,
  onToggleFolder,
  onShowInFileTree,
  onShowDependencies,
  onActivePathChange,
  activePath,
  graphFitToken = 0,
}: DependencyGraphProps) {
  const { fitView, getNode, getZoom } = useReactFlow()
  const lastFitToken = useRef(graphFitToken)
  const prevExpandedKey = useRef<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)

  const expandedFolders = useMemo(() => new Set(expandedKeys), [expandedKeys])

  const { nodes, edges } = useMemo(
    () =>
      buildGraph({
        modules,
        selectedPaths,
        expandedFolders,
        highlightedNodeId: activePath ?? null,
        folderColors,
        onToggleFolder,
        onShowInFileTree,
        onShowDependencies,
      }),
    [modules, selectedPaths, expandedFolders, activePath, folderColors, onToggleFolder, onShowInFileTree, onShowDependencies],
  )

  const displayEdges = useMemo(
    () => applySelectedEdgeStyle(edges, selectedEdgeId),
    [edges, selectedEdgeId],
  )

  const selectionKey = useMemo(
    () => selectedPaths.slice().sort().join('|'),
    [selectedPaths],
  )

  const expandedStructureKey = useMemo(
    () => expandedKeys.slice().sort().join('|'),
    [expandedKeys],
  )

  useEffect(() => {
    if (nodes.length === 0) return
    if (graphFitToken !== lastFitToken.current) return

    const frame = requestAnimationFrame(() => {
      fitView({ padding: 0.2, duration: 200 })
    })
    return () => cancelAnimationFrame(frame)
  }, [selectionKey, nodes.length, fitView, graphFitToken])

  useEffect(() => {
    if (prevExpandedKey.current === null) {
      prevExpandedKey.current = expandedStructureKey
      return
    }
    if (prevExpandedKey.current === expandedStructureKey) return
    prevExpandedKey.current = expandedStructureKey

    if (!activePath || !getNode(activePath)) return
    if (graphFitToken !== lastFitToken.current) return

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
  }, [expandedStructureKey, activePath, nodes, fitView, getNode, getZoom, graphFitToken])

  useEffect(() => {
    if (graphFitToken === lastFitToken.current) return
    if (!activePath) return
    if (!getNode(activePath)) return

    lastFitToken.current = graphFitToken

    const frame = requestAnimationFrame(() => {
      fitView({ nodes: [{ id: activePath }], padding: 0.5, duration: 300 })
    })
    return () => cancelAnimationFrame(frame)
  }, [graphFitToken, activePath, nodes, fitView, getNode])

  useEffect(() => {
    if (selectedEdgeId == null) return
    if (!edges.some((edge) => edge.id === selectedEdgeId)) {
      setSelectedEdgeId(null)
    }
  }, [edges, selectedEdgeId, selectionKey, expandedStructureKey])

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedEdgeId(null)
  }, [])

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedEdgeId(null)
      if (activePath === node.id) {
        return
      }
      onActivePathChange?.(node.id)
    },
    [activePath, onActivePathChange],
  )

  const nodeColor = useCallback((node: Node) => {
    if (node.type === 'folderGroup') {
      return (node.data as FolderGroupNodeData).backgroundColor
    }
    if (node.type === 'folder') {
      return (node.data as FolderNodeData).backgroundColor
    }
    return '#fff'
  }, [])

  if (selectedPaths.length === 0) {
    return (
      <div className={styles.empty}>
        Select files or folders to view dependencies
      </div>
    )
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={displayEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodeClick={onNodeClick}
      onEdgeClick={onEdgeClick}
      onPaneClick={onPaneClick}
      nodesDraggable={false}
      minZoom={0.01}
      maxZoom={20}
      onlyRenderVisibleElements
      fitView
      proOptions={{ hideAttribution: true }}
    >
      <Background />
      <Panel position="top-right">
        <GraphLegend />
      </Panel>
      <MiniMap
        position="bottom-left"
        pannable
        zoomable
        nodeColor={nodeColor}
        nodeStrokeColor="#d9d9d9"
        maskColor="rgba(240, 240, 240, 0.6)"
        style={{ width: 160, height: 120 }}
      />
      <Controls position="bottom-right" showInteractive={false} />
    </ReactFlow>
  )
}

export function DependencyGraph(props: DependencyGraphProps) {
  return (
    <div className={styles.container}>
      <ReactFlowProvider>
        <DependencyGraphInner {...props} />
      </ReactFlowProvider>
    </div>
  )
}
