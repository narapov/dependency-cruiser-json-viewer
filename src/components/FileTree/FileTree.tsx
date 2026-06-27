import { useCallback, useEffect, useMemo, useRef } from 'react'
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined'
import FolderOutlined from '@mui/icons-material/FolderOutlined'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import { styled } from '@mui/material/styles'
import {
  Tree,
  isTreeLeaf,
  type TreeHandle,
  type TreeNodeData,
} from '../../Shared'
import {
  applyCascadeSelection,
  buildTreeIndex,
  canShowInGraph,
  getAllFolderKeys,
  getAllKeys,
} from './helpers'
import { FileTreeContextMenu } from './partials/FileTreeContextMenu'

const CLICK_DELAY_MS = 250

const TreeNodeTitle = styled('span', {
  shouldForwardProp: (prop) => prop !== 'navigable',
})<{ navigable?: boolean }>(({ navigable }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  whiteSpace: 'nowrap',
  cursor: navigable ? 'pointer' : undefined,
}))

const TreeNodeTitleText = styled('span')({
  flex: '0 1 auto',
})

interface FileTreeProps {
  treeData: TreeNodeData[]
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
  treeData,
  selectedKeys = [],
  onSelect,
  expandedKeys,
  onExpand,
  onExpandRecursive,
  onShowInGraph,
  onShowDependencies,
  activePath,
}: FileTreeProps) {
  const treeRef = useRef<TreeHandle>(null)
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const treeIndex = useMemo(() => buildTreeIndex(treeData), [treeData])
  const allKeys = useMemo(() => getAllKeys(treeData), [treeData])
  const allFolderKeys = useMemo(() => getAllFolderKeys(treeData), [treeData])

  const allSelected = allKeys.length > 0 && allKeys.every((key) => selectedKeys.includes(key))
  const someSelected = selectedKeys.length > 0 && !allSelected
  const allExpanded =
    allFolderKeys.length > 0 && allFolderKeys.every((key) => expandedKeys.includes(key))
  const someExpanded = expandedKeys.length > 0 && !allExpanded

  const toggleExpand = useCallback(
    (key: string) => {
      onExpand(
        expandedKeys.includes(key)
          ? expandedKeys.filter((expandedKey) => expandedKey !== key)
          : [...expandedKeys, key],
      )
    },
    [expandedKeys, onExpand],
  )

  useEffect(() => {
    if (!activePath) return

    const frame = requestAnimationFrame(() => {
      treeRef.current?.scrollIntoView(activePath)
    })

    return () => cancelAnimationFrame(frame)
  }, [activePath, expandedKeys])

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current)
      }
    }
  }, [])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
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
      <Tree
        ref={treeRef}
        treeData={treeData}
        checkable
        checkedKeys={selectedKeys}
        expandedKeys={expandedKeys}
        activeKey={activePath}
        onCheck={(key, checked) => {
          onSelect?.(applyCascadeSelection(selectedKeys, key, checked, treeIndex))
        }}
        onClick={({ key, node }) => {
          if (!canShowInGraph(key, selectedKeys, treeIndex, node)) return

          if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
          clickTimerRef.current = setTimeout(() => {
            clickTimerRef.current = null
            onShowInGraph?.(key)
          }, CLICK_DELAY_MS)
        }}
        onDoubleClick={({ key, node }) => {
          if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current)
            clickTimerRef.current = null
          }
          if (!isTreeLeaf(node)) {
            toggleExpand(key)
          }
        }}
        onExpand={(key, expanded) => {
          onExpand(
            expanded
              ? [...expandedKeys, key]
              : expandedKeys.filter((expandedKey) => expandedKey !== key),
          )
        }}
        titleRender={(node) => {
          const isFolder = !isTreeLeaf(node)
          const navigable = canShowInGraph(node.key, selectedKeys, treeIndex, node)

          const title = (
            <TreeNodeTitle navigable={navigable}>
              {isFolder ? (
                <FolderOutlined fontSize="inherit" />
              ) : (
                <InsertDriveFileOutlined fontSize="inherit" />
              )}
              <TreeNodeTitleText>{node.title}</TreeNodeTitleText>
            </TreeNodeTitle>
          )

          return (
            <FileTreeContextMenu
              path={node.key}
              isFolder={isFolder}
              onExpandRecursive={isFolder ? onExpandRecursive : undefined}
              onShowDependencies={navigable ? onShowDependencies : undefined}
            >
              {title}
            </FileTreeContextMenu>
          )
        }}
      />
    </Box>
  )
}
