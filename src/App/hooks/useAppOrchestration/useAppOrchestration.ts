import { useEffect, useState, type RefObject } from 'react'
import type { DependencyGraphHandle } from '../../../components/DependencyGraph'
import type { FileTreeHandle } from '../../../components/FileTree'
import type { DependencyCruiserState } from '../../../domain'
import {
  getAncestorKeys,
  getSubtreeFolderKeys,
  isPathVisibleInSelection,
  resolveActivePathAfterCollapse,
  toggleExpandedKey,
} from '../../../domain'

interface UseAppOrchestrationOptions {
  sources: string[]
  fileTreeRef: RefObject<FileTreeHandle | null>
  graphRef: RefObject<DependencyGraphHandle | null>
  initialDependencyCruiserState: DependencyCruiserState
}

export function useAppOrchestration({
  sources,
  fileTreeRef,
  graphRef,
  initialDependencyCruiserState,
}: UseAppOrchestrationOptions) {
  const [selectedPaths, setSelectedPaths] = useState(initialDependencyCruiserState.selectedKeys)
  const [expandedKeys, setExpandedKeys] = useState(initialDependencyCruiserState.expandedKeys)
  const [activePath, setActivePath] = useState<string | null>(null)
  const [dependenciesPath, setDependenciesPath] = useState<string | null>(null)

  useEffect(() => {
    setSelectedPaths(initialDependencyCruiserState.selectedKeys)
  }, [initialDependencyCruiserState.selectedKeys])

  useEffect(() => {
    setExpandedKeys(initialDependencyCruiserState.expandedKeys)
  }, [initialDependencyCruiserState.expandedKeys])

  const panelOpen = dependenciesPath != null

  const updateExpandedKeys = (updater: string[] | ((prev: string[]) => string[])) => {
    setExpandedKeys((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      const collapsed = prev.filter((key) => !next.includes(key))
      if (collapsed.length > 0) {
        setActivePath((current) => resolveActivePathAfterCollapse(current, collapsed))
      }
      return next
    })
  }

  const activatePath = (path: string) => {
    const ancestors = getAncestorKeys(path)
    setExpandedKeys((keys) => [...new Set([...keys, ...ancestors])])
    setActivePath(path)
  }

  const showInGraph = (path: string) => {
    activatePath(path)
    graphRef.current?.focusNode(path)
  }

  const showInFileTree = (path: string) => {
    activatePath(path)
    fileTreeRef.current?.focusPath(path)
  }

  const toggleFolder = (path: string) => {
    updateExpandedKeys((keys) => toggleExpandedKey(keys, path))
  }

  const expandRecursive = (path: string) => {
    updateExpandedKeys((keys) => [
      ...new Set([...keys, ...getSubtreeFolderKeys(path, sources)]),
    ])
  }

  const handleShowDependencies = (path: string) => {
    setDependenciesPath(path)
  }

  const handleClosePanel = () => {
    setDependenciesPath(null)
  }

  const handleQuickOpenSelect = (path: string) => {
    activatePath(path)
    if (isPathVisibleInSelection(path, selectedPaths)) {
      graphRef.current?.focusNode(path)
    }
    fileTreeRef.current?.focusPath(path)
  }

  return {
    panelOpen,
    selectedPaths,
    expandedKeys,
    activePath,
    dependenciesPath,
    setSelectedPaths,
    updateExpandedKeys,
    activatePath,
    showInGraph,
    showInFileTree,
    toggleFolder,
    expandRecursive,
    handleShowDependencies,
    handleClosePanel,
    handleQuickOpenSelect,
  }
}
