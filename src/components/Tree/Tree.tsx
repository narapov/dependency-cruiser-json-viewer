import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import { buildDescendantIndex, computeIndeterminateKeys } from './buildDescendantIndex'
import { TreeNode } from './TreeNode'
import type { TreeHandle, TreeProps } from './types'
import styles from './Tree.module.css'

export const Tree = forwardRef<TreeHandle, TreeProps>(function Tree(
  {
    treeData,
    expandedKeys,
    checkedKeys = [],
    activeKey = null,
    checkable = false,
    className,
    titleRender,
    onClick,
    onDoubleClick,
    onCheck,
    onContextMenu,
    onExpand,
  },
  ref,
) {
  const elementRegistry = useRef(new Map<string, HTMLElement>())

  const descendantsByKey = useMemo(
    () => buildDescendantIndex(treeData),
    [treeData],
  )

  const checkedSet = useMemo(() => new Set(checkedKeys), [checkedKeys])

  const indeterminateSet = useMemo(
    () => computeIndeterminateKeys(checkedKeys, descendantsByKey),
    [checkedKeys, descendantsByKey],
  )

  const registerElement = useCallback((key: string, element: HTMLElement | null) => {
    if (element) {
      elementRegistry.current.set(key, element)
    } else {
      elementRegistry.current.delete(key)
    }
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      getElementByKey(key: string) {
        return elementRegistry.current.get(key) ?? null
      },
      scrollIntoView(key: string, options?: ScrollIntoViewOptions) {
        elementRegistry.current
          .get(key)
          ?.scrollIntoView({ block: 'nearest', ...options })
      },
    }),
    [],
  )

  const viewportClassName = className
    ? `${styles.viewport} ${className}`
    : styles.viewport

  return (
    <div className={viewportClassName}>
      {treeData.map((node) => (
        <TreeNode
          key={node.key}
          node={node}
          depth={0}
          expanded={expandedKeys.includes(node.key)}
          checked={checkedSet.has(node.key)}
          indeterminate={indeterminateSet.has(node.key)}
          active={node.key === activeKey}
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
  )
})
