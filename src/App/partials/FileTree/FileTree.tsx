import { useEffect, useImperativeHandle, useRef, type MouseEvent, type Ref, type SyntheticEvent } from 'react';

import Box from '@mui/material/Box';
import { useRichTreeViewApiRef } from '@mui/x-tree-view/hooks';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';

import { isPathVisibleInSelectionRecord } from '@/domain';

import { pathsToPresenceRecord, presenceRecordToPaths, useWorkspaceStore } from '../../stores/workspaceStore';
import { FileTreeActionsProvider } from './contexts';
import { buildFileTree } from './helpers';
import { useFileTreeContextMenu } from './hooks';
import { FileTreeItem } from './partials/FileTreeItem';
import type { FileTreeHandle } from './types';

const CLICK_DELAY_MS = 250;

const SELECTION_PROPAGATION = { descendants: true, parents: true } as const;

interface FileTreeProps {
  ref?: Ref<FileTreeHandle>;
  onShowInGraph: (path: string) => void;
  onViewModuleJson: (path: string) => void;
}

export function FileTree(props: FileTreeProps) {
  const { ref, onShowInGraph, onViewModuleJson } = props;

  const cruiseTree = useWorkspaceStore(state => state.cruiseTree);
  const selectedFilePaths = useWorkspaceStore(state => state.selectedFilePaths);
  const expandedFolderPaths = useWorkspaceStore(state => state.expandedFolderPaths);
  const activePath = useWorkspaceStore(state => state.activePath);
  const setSelectedFilePaths = useWorkspaceStore(state => state.setSelectedFilePaths);
  const replaceExpandedFolderPaths = useWorkspaceStore(state => state.replaceExpandedFolderPaths);

  const selectedKeys = presenceRecordToPaths(selectedFilePaths);
  const expandedKeys = presenceRecordToPaths(expandedFolderPaths);

  const apiRef = useRichTreeViewApiRef();
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const treeData = buildFileTree(cruiseTree);

  const { openContextMenu, contextMenu } = useFileTreeContextMenu({
    onShowInGraph,
    onViewModuleJson,
  });

  const canShowNodeInGraph = (key: string) =>
    isPathVisibleInSelectionRecord(key, selectedFilePaths, cruiseTree.nodes.get(key)?.descendantFiles ?? []);

  useImperativeHandle(ref, () => ({
    focusPath(path: string) {
      requestAnimationFrame(() => {
        apiRef.current?.getItemDOMElement(path)?.scrollIntoView({ block: 'nearest' });
        apiRef.current?.focusItem?.(null, path);
      });
    },
  }));

  const handleSelectedItemsChange = (_event: unknown, itemIds?: string[]) => {
    const keys = Array.isArray(_event) ? _event : itemIds;
    if (keys) {
      setSelectedFilePaths(pathsToPresenceRecord(keys));
    }
  };

  const handleExpandedItemsChange = (_event: unknown, itemIds?: string[]) => {
    const keys = Array.isArray(_event) ? _event : itemIds;
    if (keys) {
      replaceExpandedFolderPaths(keys);
    }
  };

  const handleShowInGraph = (itemId: string) => {
    if (!canShowNodeInGraph(itemId)) {
      return;
    }
    onShowInGraph(itemId);
  };

  const handleItemClick = (event: SyntheticEvent, itemId: string) => {
    // MUI TreeView fires onItemClick for checkbox clicks too
    // ignore those so selection doesn't trigger show-in-graph
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest('.MuiTreeItem-checkbox, .MuiCheckbox-root, input[type="checkbox"]')
    ) {
      return;
    }

    if (!canShowNodeInGraph(itemId)) {
      return;
    }

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      handleShowInGraph(itemId);
    }, CLICK_DELAY_MS);
  };

  useEffect(() => {
    if (!activePath) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      apiRef.current?.getItemDOMElement(activePath)?.scrollIntoView({ block: 'nearest' });
    });

    return () => cancelAnimationFrame(frame);
  }, [activePath, expandedKeys, apiRef]);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  return (
    <Box
      sx={{ height: '100%', minHeight: 0, minWidth: 0, overflowX: 'auto', overflowY: 'auto', userSelect: 'none' }}
      onContextMenu={(event: MouseEvent) => event.preventDefault()}
    >
      <FileTreeActionsProvider value={{ openContextMenu, onShowInGraph }}>
        <RichTreeView
          sx={{
            minWidth: 'max-content',
            width: '100%',
            '& .MuiTreeItem-content': theme => ({
              borderRadius: 0,
              py: 0,
              pr: 0.5,
              paddingLeft: `calc(${theme.spacing(0.5)} + var(--TreeView-itemChildrenIndentation) * var(--TreeView-itemDepth))`,
              gap: 0.5,
            }),
          }}
          apiRef={apiRef}
          items={treeData}
          getItemId={item => item.key}
          getItemLabel={item => (typeof item.title === 'string' ? item.title : item.key)}
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
        {contextMenu}
      </FileTreeActionsProvider>
    </Box>
  );
}
