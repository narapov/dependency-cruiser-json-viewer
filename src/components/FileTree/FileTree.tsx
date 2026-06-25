import { useEffect, useMemo, useRef, useState } from 'react'
import { FileOutlined, FolderOutlined } from '@ant-design/icons'
import { Tree, type TreeDataNode } from 'antd'
import { applyCascadeSelection, buildTreeIndex, computeCheckState } from '../../lib/treeSelection'
import styles from './FileTree.module.css'

interface FileTreeProps {
  treeData: TreeDataNode[]
  selectedKeys?: string[]
  onSelect?: (keys: string[]) => void
  expandedKeys: string[]
  onExpand: (keys: string[]) => void
}

export function FileTree({
  treeData,
  selectedKeys = [],
  onSelect,
  expandedKeys,
  onExpand,
}: FileTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  const treeIndex = useMemo(() => buildTreeIndex(treeData), [treeData])
  const checkedKeys = useMemo(
    () => computeCheckState(selectedKeys, treeIndex),
    [selectedKeys, treeIndex],
  )

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const observer = new ResizeObserver(([entry]) => {
      setHeight(entry.contentRect.height)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const handleToggle = (key: string, checked: boolean) => {
    onSelect?.(applyCascadeSelection(selectedKeys, key, checked, treeIndex))
  }

  return (
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
          onSelect={(_keys, { node, selected }) => {
            handleToggle(String(node.key), selected)
          }}
          expandedKeys={expandedKeys}
          onExpand={(keys) => onExpand(keys.map(String))}
          virtual={false}
          height={height}
          titleRender={(node) => (
            <span className={styles.title}>
              {node.isLeaf ? <FileOutlined /> : <FolderOutlined />}
              {node.title as string}
            </span>
          )}
        />
      )}
    </div>
  )
}
