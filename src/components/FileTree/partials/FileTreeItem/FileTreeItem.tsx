import { forwardRef } from 'react'
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined'
import FolderOutlined from '@mui/icons-material/FolderOutlined'
import { useTreeItemModel } from '@mui/x-tree-view/hooks'
import { TreeItem, type TreeItemProps } from '@mui/x-tree-view/TreeItem'
import { isTreeLeaf } from '../../helpers'
import type { TreeNodeData } from '../../types'
import { useFileTreeContextMenu } from '../../hooks'
import { useFileTreeContext } from './FileTreeContext'

export const FileTreeItem = forwardRef<HTMLLIElement, TreeItemProps>(function FileTreeItem(
  props,
  ref,
) {
  const { itemId, children, ...other } = props
  const ctx = useFileTreeContext()
  const item = useTreeItemModel<TreeNodeData>(itemId)
  const isFolder = item != null && !isTreeLeaf(item)
  const navigable = item != null && ctx.canShowInGraph(itemId)

  const { onContextMenu, contextMenu } = useFileTreeContextMenu({
    path: item?.key ?? itemId,
    isFolder,
    onExpandRecursive: isFolder ? ctx.onExpandRecursive : undefined,
    onShowDependencies: navigable ? ctx.onShowDependencies : undefined,
  })

  return (
    <>
      <TreeItem
        {...other}
        ref={ref}
        itemId={itemId}
        slots={{
          label: ({ onDoubleClick, children: labelChildren, style, ...labelProps }) => (
            <div
              {...labelProps}
              style={{ ...style, overflow: 'visible', minWidth: 'auto' }}
              onDoubleClick={(event) => {
                if (isFolder) {
                  ctx.onToggleExpand(itemId)
                }
                onDoubleClick?.(event)
              }}
            >
              {item ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    whiteSpace: 'nowrap',
                    cursor: navigable ? 'pointer' : undefined,
                  }}
                >
                  {isFolder ? (
                    <FolderOutlined fontSize="inherit" />
                  ) : (
                    <InsertDriveFileOutlined fontSize="inherit" />
                  )}
                  <span>{item.title}</span>
                </span>
              ) : (
                labelChildren
              )}
            </div>
          ),
        }}
        slotProps={{
          content: { onContextMenu, title: item?.key ?? itemId },
        }}
      >
        {children}
      </TreeItem>
      {contextMenu}
    </>
  )
})
