import { forwardRef, type KeyboardEvent } from 'react';

import { useTreeItemModel } from '@mui/x-tree-view/hooks';
import type { TreeViewCancellableEvent } from '@mui/x-tree-view/models';
import { TreeItem, type TreeItemProps } from '@mui/x-tree-view/TreeItem';

import { getBaseName } from '../../../../domain';
import { MaterialFileSystemIcon } from '../../../../Shared';
import { isTreeLeaf } from '../../helpers';
import { useFileTreeContextMenu } from '../../hooks';
import type { TreeNodeData } from '../../types';
import { useFileTreeContext } from './FileTreeContext';

export const FileTreeItem = forwardRef<HTMLLIElement, TreeItemProps>(function FileTreeItem(props, ref) {
  const { itemId, children, ...other } = props;
  const ctx = useFileTreeContext();
  const item = useTreeItemModel<TreeNodeData>(itemId);
  const isFolder = item != null && !isTreeLeaf(item);
  const navigable = item != null && ctx.canShowInGraph(itemId);

  const { onContextMenu, contextMenu } = useFileTreeContextMenu({
    path: item?.key ?? itemId,
    isFolder,
    expanded: isFolder ? ctx.expandedKeys.includes(itemId) : undefined,
    onToggleExpand: isFolder ? ctx.onToggleExpand : undefined,
    onExpandRecursive: isFolder ? ctx.onExpandRecursive : undefined,
    onShowInGraph: navigable ? ctx.onShowInGraph : undefined,
    onShowDependencies: navigable ? ctx.onShowDependencies : undefined,
  });

  return (
    <>
      <TreeItem
        {...other}
        ref={ref}
        itemId={itemId}
        slots={{
          label: ({
            onDoubleClick,
            children: labelChildren,
            style,
            editable: _editable,
            ownerState: _ownerState,
            ...labelProps
          }) => (
            <div
              {...labelProps}
              style={{ ...style, overflow: 'visible', minWidth: 'auto' }}
              onDoubleClick={event => {
                if (isFolder) {
                  ctx.onToggleExpand(itemId);
                }
                onDoubleClick?.(event);
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
                  <MaterialFileSystemIcon
                    name={getBaseName(item.key)}
                    isFolder={isFolder}
                    isOpen={isFolder ? ctx.expandedKeys.includes(itemId) : undefined}
                  />
                  <span>{item.title}</span>
                </span>
              ) : (
                labelChildren
              )}
            </div>
          ),
        }}
        slotProps={{
          root: {
            onKeyDown: (event: KeyboardEvent<HTMLLIElement> & TreeViewCancellableEvent) => {
              if (event.key !== 'Enter') return;
              event.defaultMuiPrevented = true;
              event.preventDefault();
              event.stopPropagation();
              if (navigable) {
                ctx.onShowInGraph?.(itemId);
              }
            },
          },
          content: {
            onContextMenu,
            title: item?.key ?? itemId,
          },
        }}
      >
        {children}
      </TreeItem>
      {contextMenu}
    </>
  );
});
