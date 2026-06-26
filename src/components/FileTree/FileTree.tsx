import { useCallback, useEffect, useMemo, useRef } from 'react'
import { FileOutlined, FolderOutlined } from '@ant-design/icons'
import { Checkbox } from 'antd'
import {
  applyCascadeSelection,
  buildTreeIndex,
  canShowInGraph,
  getAllFolderKeys,
  getAllKeys,
} from '../../lib/treeSelection'
import { Tree, isTreeLeaf, type TreeHandle, type TreeNodeData } from '../Tree'
import { FileTreeContextMenu } from './FileTreeContextMenu'
import styles from './FileTree.module.css'

const CLICK_DELAY_MS = 250

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
    <div className={styles.container}>
      <div className={styles.controls}>
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected}
          onChange={(event) => onSelect?.(event.target.checked ? allKeys : [])}
        >
          Select all
        </Checkbox>
        <Checkbox
          checked={allExpanded}
          indeterminate={someExpanded}
          onChange={(event) => onExpand(event.target.checked ? allFolderKeys : [])}
        >
          Expand all
        </Checkbox>
      </div>
      <Tree
        ref={treeRef}
        className={styles.tree}
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
            <span className={`${styles.title} ${navigable ? styles.navigable : ''}`}>
              {isFolder ? <FolderOutlined /> : <FileOutlined />}
              <span className={styles.titleText}>{node.title}</span>
            </span>
          )

          if (isFolder) {
            return (
              <FileTreeContextMenu
                path={node.key}
                isFolder
                onExpandRecursive={onExpandRecursive}
                onShowDependencies={navigable ? onShowDependencies : undefined}
              >
                {title}
              </FileTreeContextMenu>
            )
          }

          if (navigable && onShowDependencies) {
            return (
              <FileTreeContextMenu path={node.key} onShowDependencies={onShowDependencies}>
                {title}
              </FileTreeContextMenu>
            )
          }

          return title
        }}
      />
    </div>
  )
}
