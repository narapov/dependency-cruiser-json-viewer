import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { IModule } from 'dependency-cruiser'
import { buildGraph } from '../../lib/dependencyGraph/buildGraph'
import type { FolderGroupNodeData, FolderNodeData } from '../../lib/dependencyGraph/types'
import { FileNode } from './FileNode'
import { FolderGroupNode } from './FolderGroupNode'
import { FolderNode } from './FolderNode'
import styles from './DependencyGraph.module.css'

const nodeTypes = {
  folder: FolderNode,
  folderGroup: FolderGroupNode,
  file: FileNode,
}

interface DependencyGraphProps {
  modules: IModule[]
  selectedPaths: string[]
  folderColors: ReadonlyMap<string, string>
  expandedKeys: string[]
  onToggleFolder: (path: string) => void
  onShowInFileTree: (path: string) => void
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
  onActivePathChange,
  activePath,
  graphFitToken = 0,
}: DependencyGraphProps) {
  const { fitView, getNode } = useReactFlow()
  const lastFitToken = useRef(graphFitToken)

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
      }),
    [modules, selectedPaths, expandedFolders, activePath, folderColors, onToggleFolder, onShowInFileTree],
  )

  const structureKey = useMemo(
    () => `${selectedPaths.length}:${expandedKeys.slice().sort().join('|')}`,
    [selectedPaths, expandedKeys],
  )

  useEffect(() => {
    if (nodes.length === 0) return
    if (graphFitToken !== lastFitToken.current) return

    const frame = requestAnimationFrame(() => {
      fitView({ padding: 0.2, duration: 200 })
    })
    return () => cancelAnimationFrame(frame)
  }, [structureKey, nodes.length, fitView, graphFitToken])

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

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
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
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={onNodeClick}
      nodesDraggable={false}
      minZoom={0.01}
      maxZoom={20}
      onlyRenderVisibleElements
      fitView
      proOptions={{ hideAttribution: true }}
    >
      <Background />
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
