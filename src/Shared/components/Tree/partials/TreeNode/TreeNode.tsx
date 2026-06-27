import { memo, useEffect, useRef } from 'react'
import ArrowDropDown from '@mui/icons-material/ArrowDropDown'
import ChevronRight from '@mui/icons-material/ChevronRight'
import { isTreeBranch } from '../../helpers/treeGuards'
import type { TreeNodeData, TreeNodeEventInfo } from '../../types'
import styles from '../../Tree.module.css'

export interface TreeNodeProps {
  node: TreeNodeData
  depth: number
  expanded: boolean
  checked: boolean
  indeterminate: boolean
  active: boolean
  checkable: boolean
  expandedKeys: string[]
  checkedKeys: string[]
  checkedSet: Set<string>
  indeterminateSet: Set<string>
  activeKey: string | null
  titleRender?: (node: TreeNodeData) => React.ReactNode
  registerElement: (key: string, element: HTMLElement | null) => void
  onClick?: (info: TreeNodeEventInfo) => void
  onDoubleClick?: (info: TreeNodeEventInfo) => void
  onCheck?: (key: string, checked: boolean, info: TreeNodeEventInfo) => void
  onContextMenu?: (info: TreeNodeEventInfo) => void
  onExpand?: (key: string, expanded: boolean, info: TreeNodeEventInfo) => void
}

function TreeNodeComponent({
  node,
  depth,
  expanded,
  checked,
  indeterminate,
  active,
  checkable,
  expandedKeys,
  checkedKeys,
  checkedSet,
  indeterminateSet,
  activeKey,
  titleRender,
  registerElement,
  onClick,
  onDoubleClick,
  onCheck,
  onContextMenu,
  onExpand,
}: TreeNodeProps) {
  const checkboxRef = useRef<HTMLInputElement>(null)
  const branch = isTreeBranch(node)

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate
    }
  }, [indeterminate])

  const makeEventInfo = (nativeEvent: React.MouseEvent): TreeNodeEventInfo => ({
    key: node.key,
    node,
    nativeEvent,
  })

  const handleExpandClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    onExpand?.(node.key, !expanded, makeEventInfo(event))
  }

  const handleCheckClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    onCheck?.(node.key, !checked, makeEventInfo(event))
  }

  const handleContentClick = (event: React.MouseEvent) => {
    onClick?.(makeEventInfo(event))
  }

  const handleContentDoubleClick = (event: React.MouseEvent) => {
    onDoubleClick?.(makeEventInfo(event))
  }

  const handleContentContextMenu = (event: React.MouseEvent) => {
    onContextMenu?.(makeEventInfo(event));
    event.preventDefault();
  }

  return (
    <>
      <div
        ref={(element) => registerElement(node.key, element)}
        id={`tree-node-${encodeURIComponent(node.key)}`}
        data-tree-key={node.key}
        className={`${styles.row} ${active ? styles.active : ''} ${branch && expanded ? styles.rowSticky : ''}`}
        style={{
          paddingLeft: depth * 12,
          ['--tree-depth' as string]: depth,
        }}
      >
        {branch ? (
          <button
            type="button"
            className={styles.switcher}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse' : 'Expand'}
            onClick={handleExpandClick}
          >
            {expanded ? <ArrowDropDown fontSize="inherit" /> : <ChevronRight fontSize="inherit" />}
          </button>
        ) : (
          <span className={styles.switcherPlaceholder} />
        )}

        {checkable && (
          <input
            ref={checkboxRef}
            type="checkbox"
            className={styles.checkbox}
            checked={checked}
            onClick={handleCheckClick}
            readOnly
          />
        )}

        <span
          className={styles.content}
          onClick={handleContentClick}
          onDoubleClick={handleContentDoubleClick}
          onContextMenu={handleContentContextMenu}
        >
          {titleRender ? titleRender(node) : node.title}
        </span>
      </div>

      {branch && expanded && node.children!.length > 0 && (
        <div className={styles.children}>
          {node.children!.map((child) => (
            <MemoTreeNode
              key={child.key}
              node={child}
              depth={depth + 1}
              expanded={expandedKeys.includes(child.key)}
              checked={checkedSet.has(child.key)}
              indeterminate={indeterminateSet.has(child.key)}
              active={child.key === activeKey}
              checkable={checkable}
              expandedKeys={expandedKeys}
              checkedKeys={checkedKeys}
              checkedSet={checkedSet}
              indeterminateSet={indeterminateSet}
              activeKey={activeKey}
              titleRender={titleRender}
              registerElement={registerElement}
              onClick={onClick}
              onDoubleClick={onDoubleClick}
              onCheck={onCheck}
              onContextMenu={onContextMenu}
              onExpand={onExpand}
            />
          ))}
        </div>
      )}
    </>
  )
}

function propsAreEqual(prev: TreeNodeProps, next: TreeNodeProps): boolean {
  return (
    prev.node === next.node &&
    prev.depth === next.depth &&
    prev.expanded === next.expanded &&
    prev.checked === next.checked &&
    prev.indeterminate === next.indeterminate &&
    prev.active === next.active &&
    prev.checkable === next.checkable &&
    prev.expandedKeys === next.expandedKeys &&
    prev.checkedKeys === next.checkedKeys &&
    prev.checkedSet === next.checkedSet &&
    prev.indeterminateSet === next.indeterminateSet &&
    prev.activeKey === next.activeKey &&
    prev.titleRender === next.titleRender &&
    prev.registerElement === next.registerElement &&
    prev.onClick === next.onClick &&
    prev.onDoubleClick === next.onDoubleClick &&
    prev.onCheck === next.onCheck &&
    prev.onContextMenu === next.onContextMenu &&
    prev.onExpand === next.onExpand
  )
}

const MemoTreeNode = memo(TreeNodeComponent, propsAreEqual)

export { MemoTreeNode as TreeNode }
