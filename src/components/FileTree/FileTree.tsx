import { useEffect, useImperativeHandle, useRef, type Ref, type SyntheticEvent } from 'react'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import { useRichTreeViewApiRef } from '@mui/x-tree-view/hooks'
import { RichTreeView } from '@mui/x-tree-view/RichTreeView'
import { isPathVisibleInSelection } from '../../domain'
import {
  buildFileTree,
  buildTreeIndex,
  getAllFolderKeys,
  getAllKeys,
} from './helpers'
import { FileTreeItem, FileTreeProvider } from './partials/FileTreeItem'
import type { FileTreeHandle } from './types'

const CLICK_DELAY_MS = 250

const SELECTION_PROPAGATION = { descendants: true, parents: true } as const

interface FileTreeProps {
  ref?: Ref<FileTreeHandle>
  sources: string[]
  selectedKeys?: string[]
  onSelect?: (keys: string[]) => void
  expandedKeys: string[]
  onExpand: (keys: string[]) => void
  onExpandRecursive?: (path: string) => void
  onShowInGraph?: (path: string) => void
  onShowDependencies?: (path: string) => void
  activePath?: string | null
}

export function FileTree({
  ref,
  sources,
  selectedKeys = [],
  onSelect,
  expandedKeys,
  onExpand,
  onExpandRecursive,
  onShowInGraph,
  onShowDependencies,
  activePath = null,
}: FileTreeProps) {
  const apiRef = useRichTreeViewApiRef()
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const treeData = buildFileTree(sources)
  const treeIndex = buildTreeIndex(treeData)
  const allKeys = getAllKeys(treeData)
  const allFolderKeys = getAllFolderKeys(treeData)

  const allSelected = allKeys.length > 0 && allKeys.every((key) => selectedKeys.includes(key))
  const someSelected = selectedKeys.length > 0 && !allSelected
  const allExpanded =
    allFolderKeys.length > 0 && allFolderKeys.every((key) => expandedKeys.includes(key))
  const someExpanded = expandedKeys.length > 0 && !allExpanded

  const canShowNodeInGraph = (key: string) => isPathVisibleInSelection(key, selectedKeys)

  const toggleExpand = (key: string) => {
    onExpand(
      expandedKeys.includes(key)
        ? expandedKeys.filter((expandedKey) => expandedKey !== key)
        : [...expandedKeys, key],
    )
  }

  useImperativeHandle(ref, () => ({
    focusPath(path: string) {
      requestAnimationFrame(() => {
        apiRef.current?.getItemDOMElement(path)?.scrollIntoView({ block: 'nearest' })
        apiRef.current?.focusItem?.(null, path)
      })
    },
  }))

  const handleSelectedItemsChange = (_event: unknown, itemIds?: string[]) => {
    const keys = Array.isArray(_event) ? _event : itemIds
    if (keys) {
      onSelect?.(keys)
    }
  }

  const handleExpandedItemsChange = (_event: unknown, itemIds?: string[]) => {
    const keys = Array.isArray(_event) ? _event : itemIds
    if (keys) {
      onExpand(keys)
    }
  }

  const handleShowInGraph = (itemId: string) => {
    if (!canShowNodeInGraph(itemId)) return
    onShowInGraph?.(itemId)
  }

  const handleItemClick = (_event: SyntheticEvent, itemId: string) => {
    if (!canShowNodeInGraph(itemId)) return

    if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null
      handleShowInGraph(itemId)
    }, CLICK_DELAY_MS)
  }

  const fileTreeContext = {
    activePath,
    selectedKeys,
    expandedKeys,
    treeIndex,
    canShowInGraph: canShowNodeInGraph,
    onExpandRecursive,
    onShowDependencies,
    onShowInGraph: handleShowInGraph,
    onToggleExpand: toggleExpand,
  }

  useEffect(() => {
    if (!activePath) return

    const frame = requestAnimationFrame(() => {
      apiRef.current?.getItemDOMElement(activePath)?.scrollIntoView({ block: 'nearest' })
    })

    return () => cancelAnimationFrame(frame)
  }, [activePath, expandedKeys, apiRef])

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current)
      }
    }
  }, [])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, minWidth: 0 }}>
      <FormGroup sx={{ flexShrink: 0, px: 1.5, py: 1 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={(_, checked) => onSelect?.(checked ? allKeys : [])}
            />
          }
          label="Select all"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={allExpanded}
              indeterminate={someExpanded}
              onChange={(_, checked) => onExpand(checked ? allFolderKeys : [])}
            />
          }
          label="Expand all"
        />
      </FormGroup>
      <Divider />
      <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, overflowX: 'auto', overflowY: 'auto' }}>
        <FileTreeProvider value={fileTreeContext}>
          <RichTreeView
            sx={{
              minWidth: 'max-content',
              width: '100%',
              '& .MuiTreeItem-content': (theme) => ({
                borderRadius: 0,
                py: 0,
                pr: 0.5,
                paddingLeft: `calc(${theme.spacing(0.5)} + var(--TreeView-itemChildrenIndentation) * var(--TreeView-itemDepth))`,
                gap: 0.5,
              }),
            }}
            apiRef={apiRef}
            items={treeData}
            getItemId={(item) => item.key}
            getItemLabel={(item) =>
              typeof item.title === 'string' ? item.title : item.key
            }
            expandedItems={expandedKeys}
            onExpandedItemsChange={handleExpandedItemsChange}
            selectedItems={selectedKeys}
            onSelectedItemsChange={handleSelectedItemsChange}
            checkboxSelection
            multiSelect
            selectionPropagation={SELECTION_PROPAGATION}
            expansionTrigger="iconContainer"
            onItemClick={handleItemClick}
            slots={{ item: FileTreeItem }}
          />
        </FileTreeProvider>
      </Box>
    </Box>
  )
}
