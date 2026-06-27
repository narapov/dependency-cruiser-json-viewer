import { useCallback, useDeferredValue, useMemo, useState } from 'react'
import type { TreeNodeData } from '../../../Shared'
import {
  buildTreeIndex,
  canShowInGraph,
  findTreeNode,
  flattenTreeNodes,
  getAncestorKeys,
  getDefaultExpandedKeys,
  getDefaultSelectedKeys,
  getSubtreeFolderKeys,
  resolveActivePathAfterCollapse,
  searchTreeNodes,
  toggleExpandedKey,
} from '../../helpers'
import { useQuickOpenShortcut } from '../useQuickOpenShortcut'

export function useAppOrchestration(treeData: TreeNodeData[]) {
  const [selectedPaths, setSelectedPaths] = useState(() => getDefaultSelectedKeys(treeData))
  const [expandedKeys, setExpandedKeys] = useState(() => getDefaultExpandedKeys(treeData))
  const [activePath, setActivePath] = useState<string | null>(null)
  const [graphFitToken, setGraphFitToken] = useState(0)
  const [dependenciesPath, setDependenciesPath] = useState<string | null>(null)
  const [quickOpenOpen, setQuickOpenOpen] = useState(false)
  const [quickOpenQuery, setQuickOpenQuery] = useState('')

  const treeIndex = useMemo(() => buildTreeIndex(treeData), [treeData])
  const deferredQuickOpenQuery = useDeferredValue(quickOpenQuery)
  const allQuickOpenItems = useMemo(() => flattenTreeNodes(treeData), [treeData])
  const quickOpenResults = useMemo(
    () => searchTreeNodes(allQuickOpenItems, deferredQuickOpenQuery),
    [allQuickOpenItems, deferredQuickOpenQuery],
  )

  useQuickOpenShortcut(quickOpenOpen, setQuickOpenOpen)

  const panelOpen = dependenciesPath != null

  const updateExpandedKeys = useCallback(
    (updater: string[] | ((prev: string[]) => string[])) => {
      setExpandedKeys((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        const collapsed = prev.filter((key) => !next.includes(key))
        if (collapsed.length > 0) {
          setActivePath((current) => resolveActivePathAfterCollapse(current, collapsed))
        }
        return next
      })
    },
    [],
  )

  const onToggleFolder = useCallback(
    (path: string) => updateExpandedKeys((keys) => toggleExpandedKey(keys, path)),
    [updateExpandedKeys],
  )

  const onExpandRecursive = useCallback(
    (path: string) => {
      updateExpandedKeys((keys) => [
        ...new Set([...keys, ...getSubtreeFolderKeys(path, treeData)]),
      ])
    },
    [treeData, updateExpandedKeys],
  )

  const activatePath = useCallback((path: string) => {
    const ancestors = getAncestorKeys(path)
    setExpandedKeys((keys) => [...new Set([...keys, ...ancestors])])
    setActivePath(path)
  }, [])

  const handleShowInGraph = useCallback((path: string) => {
    const ancestors = getAncestorKeys(path)
    setExpandedKeys((keys) => [...new Set([...keys, ...ancestors])])
    setActivePath(path)
    setGraphFitToken((token) => token + 1)
  }, [])

  const handleShowInFileTree = useCallback(
    (path: string) => {
      activatePath(path)
    },
    [activatePath],
  )

  const handleActivePathChange = useCallback(
    (path: string) => {
      activatePath(path)
    },
    [activatePath],
  )

  const handleShowDependencies = useCallback((path: string) => {
    setDependenciesPath(path)
  }, [])

  const handleClosePanel = useCallback(() => {
    setDependenciesPath(null)
  }, [])

  const handleQuickOpenSelect = useCallback(
    (path: string) => {
      activatePath(path)
      const node = findTreeNode(treeData, path)
      if (node && canShowInGraph(path, selectedPaths, treeIndex, node)) {
        setGraphFitToken((token) => token + 1)
      }
    },
    [activatePath, selectedPaths, treeData, treeIndex],
  )

  const handleQuickOpenClose = useCallback(() => {
    setQuickOpenOpen(false)
    setQuickOpenQuery('')
  }, [])

  return {
    layoutProps: {
      panelOpen,
    },
    fileTreeProps: {
      treeData,
      selectedKeys: selectedPaths,
      onSelect: setSelectedPaths,
      expandedKeys,
      onExpand: updateExpandedKeys,
      onExpandRecursive,
      onShowInGraph: handleShowInGraph,
      onShowDependencies: handleShowDependencies,
      activePath,
    },
    graphProps: {
      selectedPaths,
      expandedKeys,
      onToggleFolder,
      onExpandRecursive,
      onShowInFileTree: handleShowInFileTree,
      onShowDependencies: handleShowDependencies,
      onActivePathChange: handleActivePathChange,
      activePath,
      graphFitToken,
    },
    panelProps: {
      path: dependenciesPath!,
      selectedPaths,
      expandedKeys,
      onClose: handleClosePanel,
      onShowInGraph: handleShowInGraph,
    },
    quickOpenProps: {
      open: quickOpenOpen,
      query: quickOpenQuery,
      deferredQuery: deferredQuickOpenQuery,
      results: quickOpenResults,
      onQueryChange: setQuickOpenQuery,
      onClose: handleQuickOpenClose,
      onSelect: handleQuickOpenSelect,
    },
  }
}
