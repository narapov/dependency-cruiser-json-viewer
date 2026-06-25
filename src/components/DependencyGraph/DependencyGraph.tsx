import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { IModule } from 'dependency-cruiser'
import { buildGraph } from '../../lib/dependencyGraph/buildGraph'
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
}

function DependencyGraphInner({ modules, selectedPaths, folderColors }: DependencyGraphProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => new Set())
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null)
  const { fitView } = useReactFlow()

  const onToggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  const { nodes, edges } = useMemo(
    () =>
      buildGraph({
        modules,
        selectedPaths,
        expandedFolders,
        highlightedNodeId,
        folderColors,
        onToggleFolder,
      }),
    [modules, selectedPaths, expandedFolders, highlightedNodeId, folderColors, onToggleFolder],
  )

  const structureKey = useMemo(
    () => `${selectedPaths.length}:${[...expandedFolders].sort().join('|')}`,
    [selectedPaths, expandedFolders],
  )

  useEffect(() => {
    if (nodes.length === 0) return
    const frame = requestAnimationFrame(() => {
      fitView({ padding: 0.2, duration: 200 })
    })
    return () => cancelAnimationFrame(frame)
  }, [structureKey, nodes.length, fitView])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setHighlightedNodeId((current) => (current === node.id ? null : node.id))
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
      <Controls />
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
