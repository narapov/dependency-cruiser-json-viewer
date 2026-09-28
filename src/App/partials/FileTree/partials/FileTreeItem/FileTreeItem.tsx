import { memo, type KeyboardEvent, type MouseEvent, type Ref } from 'react';

import { useTheme } from '@mui/material/styles';
import { useTreeItemModel } from '@mui/x-tree-view/hooks';
import type { TreeViewCancellableEvent } from '@mui/x-tree-view/models';
import { TreeItem, type TreeItemProps } from '@mui/x-tree-view/TreeItem';

import { getBaseName, isPathVisibleInSelectionRecord, toggleExpandedKey } from '@/domain';
import { MaterialFileSystemIcon } from '@/Shared';

import { presenceRecordToPaths, useWorkspaceStore } from '../../../../stores/workspaceStore';
import { useFileTreeActions } from '../../contexts';
import { isTreeLeaf } from '../../helpers';
import type { TreeNodeData } from '../../types';

export const FileTreeItem = memo(function FileTreeItem(props: TreeItemProps & { ref?: Ref<HTMLLIElement> }) {
  const { itemId, children, ref, ...other } = props;

  const theme = useTheme();
  const { openContextMenu, onShowInGraph } = useFileTreeActions();
  const item = useTreeItemModel<TreeNodeData>(itemId);

  const isActive = useWorkspaceStore(state => state.activePath === itemId);
  const isExpanded = useWorkspaceStore(state => state.expandedFolderPaths[itemId] === true);
  const navigable = useWorkspaceStore(state =>
    isPathVisibleInSelectionRecord(
      itemId,
      state.selectedFilePaths,
      state.cruiseSnapshot.nodes.get(itemId)?.descendantFiles ?? new Set(),
    ),
  );
  const replaceExpandedFolderPaths = useWorkspaceStore(state => state.replaceExpandedFolderPaths);

  const isFolder = item != null && !isTreeLeaf(item);

  const toggleExpand = () => {
    const expandedKeys = presenceRecordToPaths(useWorkspaceStore.getState().expandedFolderPaths);
    replaceExpandedFolderPaths(toggleExpandedKey(expandedKeys, itemId));
  };

  return (
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
                toggleExpand();
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
                  isOpen={isFolder ? isExpanded : undefined}
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
            if (event.key !== 'Enter') {
              return;
            }
            event.defaultMuiPrevented = true;
            event.preventDefault();
            event.stopPropagation();
            if (navigable) {
              onShowInGraph(itemId);
            }
          },
        },
        content: {
          onContextMenu: (event: MouseEvent) => {
            openContextMenu(event, item?.key ?? itemId);
          },
          title: item?.key ?? itemId,
          ...(isActive && {
            style: {
              boxShadow: `inset 0 0 0 1px ${theme.palette.primary.main}`,
            },
          }),
        },
      }}
    >
      {children}
    </TreeItem>
  );
});
