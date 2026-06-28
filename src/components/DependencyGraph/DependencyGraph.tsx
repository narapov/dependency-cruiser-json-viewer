import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
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
import { applySelectedEdgeStyle, assignFolderColors, buildGraph } from './helpers'
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
  const { fitView, getNode, getZoom } = useReactFlow()
  const prevExpandedKey = useRef<string | null>(null)
  const pendingFocusPath = useRef<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)

  const sources = modules.map((module) => module.source)
  const folderColors = assignFolderColors(sources)
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

  const displayEdges = applySelectedEdgeStyle(edges, activeEdgeId)

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
  })

  useImperativeHandle(imperativeRef, () => ({
    focusNode(path: string) {
      requestAnimationFrame(() => runFocusNode(path))
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
    return '#fff'
  }

  if (selectedPaths.length === 0) {
    return (
      <div className={styles.empty}>
        Select files or folders to view dependencies
      </div>
    )
  }

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={displayEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
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
