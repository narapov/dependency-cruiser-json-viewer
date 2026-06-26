import { useEffect, useMemo, useRef, useState } from 'react'
import { FileOutlined, FolderOutlined } from '@ant-design/icons'
import { Checkbox, Tree, type TreeDataNode } from 'antd'
import {
  applyCascadeSelection,
  buildTreeIndex,
  canShowInGraph,
  computeCheckState,
  getAllFolderKeys,
  getAllKeys,
} from '../../lib/treeSelection'
import styles from './FileTree.module.css'

interface FileTreeProps {
  treeData: TreeDataNode[]
  selectedKeys?: string[]
  onSelect?: (keys: string[]) => void
  expandedKeys: string[]
  onExpand: (keys: string[]) => void
  onShowInGraph?: (path: string) => void
  activePath?: string | null
}

export function FileTree({
  treeData,
  selectedKeys = [],
  onSelect,
  expandedKeys,
  onExpand,
  onShowInGraph,
  activePath,
}: FileTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  const treeIndex = useMemo(() => buildTreeIndex(treeData), [treeData])
  const allKeys = useMemo(() => getAllKeys(treeData), [treeData])
  const allFolderKeys = useMemo(() => getAllFolderKeys(treeData), [treeData])
  const checkedKeys = useMemo(
    () => computeCheckState(selectedKeys, treeIndex),
    [selectedKeys, treeIndex],
  )

  const allSelected = allKeys.length > 0 && allKeys.every((key) => selectedKeys.includes(key))
  const someSelected = selectedKeys.length > 0 && !allSelected
  const allExpanded =
    allFolderKeys.length > 0 && allFolderKeys.every((key) => expandedKeys.includes(key))
  const someExpanded = expandedKeys.length > 0 && !allExpanded

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const observer = new ResizeObserver(([entry]) => {
      setHeight(entry.contentRect.height)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!activePath) return

    const frame = requestAnimationFrame(() => {
      const node = containerRef.current?.querySelector(
        `.ant-tree-treenode[data-key="${CSS.escape(activePath)}"]`,
      )
      node?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })

    return () => cancelAnimationFrame(frame)
  }, [activePath, expandedKeys])

  const handleToggle = (key: string, checked: boolean) => {
    onSelect?.(applyCascadeSelection(selectedKeys, key, checked, treeIndex))
  }

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
      <div ref={containerRef} className={styles.scroll}>
        {height > 0 && (
          <Tree
          className={styles.tree}
          treeData={treeData}
          checkable
          checkStrictly
          checkedKeys={checkedKeys}
          onCheck={(_keys, { node, checked }) => {
            handleToggle(String(node.key), checked)
          }}
          onSelect={(_keys, { node }) => {
            const key = String(node.key)
            if (canShowInGraph(key, selectedKeys, treeIndex, !!node.isLeaf)) {
              onShowInGraph?.(key)
            }
          }}
          selectedKeys={activePath ? [activePath] : []}
          expandedKeys={expandedKeys}
          onExpand={(keys) => {
            onExpand(keys.map(String))
          }}
          virtual={false}
          height={height}
          titleRender={(node) => {
            const key = String(node.key)
            const navigable = canShowInGraph(key, selectedKeys, treeIndex, !!node.isLeaf)

            return (
              <span
                className={`${styles.title} ${key === activePath ? styles.active : ''} ${navigable ? styles.navigable : ''}`}
              >
                {node.isLeaf ? <FileOutlined /> : <FolderOutlined />}
                <span className={styles.titleText}>{node.title as string}</span>
              </span>
            )
          }}
          />
        )}
      </div>
    </div>
  )
}
