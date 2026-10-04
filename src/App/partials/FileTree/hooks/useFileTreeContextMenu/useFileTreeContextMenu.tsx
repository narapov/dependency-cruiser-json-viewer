import { useCallback, useState, type MouseEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import {
  collectFolderPathsToCollapse,
  collectFolderPathsToExpand,
  isPathVisibleInSelectionRecord,
  resolveFolderNodes,
  toggleExpandedKey,
} from '@/domain';
import { copyToClipboard } from '@/Shared';

import { presenceRecordToPaths, useWorkspaceStore } from '../../../../stores/workspaceStore';

export interface UseFileTreeContextMenuOptions {
  onShowInGraph: (path: string) => void;
  onViewModuleJson: (path: string) => void;
  promptFolderLevel: (paths: readonly string[]) => Promise<number | null>;
}

interface MenuState {
  path: string;
  anchorPosition: { top: number; left: number };
}

export function useFileTreeContextMenu(config: UseFileTreeContextMenuOptions) {
  const { onShowInGraph, onViewModuleJson, promptFolderLevel } = config;

  const { t } = useTranslation();
  const [menuState, setMenuState] = useState<MenuState | null>(null);

  const cruiseSnapshot = useWorkspaceStore(state => state.cruiseSnapshot);
  const selectedFilePaths = useWorkspaceStore(state => state.selectedFilePaths);
  const expandedFolderPaths = useWorkspaceStore(state => state.expandedFolderPaths);
  const replaceExpandedFolderPaths = useWorkspaceStore(state => state.replaceExpandedFolderPaths);
  const setDependenciesPanelPath = useWorkspaceStore(state => state.setDependenciesPanelPath);
  const setApplicableRulesPanelPath = useWorkspaceStore(state => state.setApplicableRulesPanelPath);

  const openContextMenu = useCallback((event: MouseEvent, path: string) => {
    event.preventDefault();
    setMenuState({
      path,
      anchorPosition: { top: event.clientY, left: event.clientX },
    });
  }, []);

  const handleClose = useCallback(() => {
    setMenuState(null);
  }, []);

  const handleAction = useCallback(
    (action: () => void) => (event: MouseEvent) => {
      event.stopPropagation();
      handleClose();
      action();
    },
    [handleClose],
  );

  const path = menuState?.path;
  const node = path ? cruiseSnapshot.nodes.get(path) : undefined;
  const isFolder = node?.isFolder === true;
  const expandedKeys = presenceRecordToPaths(expandedFolderPaths);
  const expanded = path && expandedFolderPaths[path] === true;
  const navigable = path && isPathVisibleInSelectionRecord(path, selectedFilePaths, node?.descendantFiles ?? new Set());

  const toggleExpand = (folderPath: string) => {
    replaceExpandedFolderPaths(toggleExpandedKey(expandedKeys, folderPath));
  };

  const expandRecursive = (folderPath: string) => {
    const folderNodes = resolveFolderNodes(cruiseSnapshot.nodes, [folderPath]);
    replaceExpandedFolderPaths([...new Set([...expandedKeys, ...collectFolderPathsToExpand(folderNodes, Infinity)])]);
  };

  const collapseRecursive = (folderPath: string) => {
    const folderNodes = resolveFolderNodes(cruiseSnapshot.nodes, [folderPath]);
    const toRemove = new Set([
      ...folderNodes.map(folderNode => folderNode.path),
      ...collectFolderPathsToCollapse(folderNodes, 1),
    ]);
    replaceExpandedFolderPaths(expandedKeys.filter(key => !toRemove.has(key)));
  };

  const expandToLevel = (folderPath: string) => {
    void promptFolderLevel([folderPath]).then(level => {
      if (level == null) {
        return;
      }
      const { cruiseSnapshot: snapshot, expandedFolderPaths: currentExpanded } = useWorkspaceStore.getState();
      const folderNodes = resolveFolderNodes(snapshot.nodes, [folderPath]);
      const previous = presenceRecordToPaths(currentExpanded);
      replaceExpandedFolderPaths([...new Set([...previous, ...collectFolderPathsToExpand(folderNodes, level)])]);
    });
  };

  const collapseToLevel = (folderPath: string) => {
    void promptFolderLevel([folderPath]).then(level => {
      if (level == null) {
        return;
      }
      const { cruiseSnapshot: snapshot, expandedFolderPaths: currentExpanded } = useWorkspaceStore.getState();
      const folderNodes = resolveFolderNodes(snapshot.nodes, [folderPath]);
      const toRemove = new Set(collectFolderPathsToCollapse(folderNodes, level));
      const previous = presenceRecordToPaths(currentExpanded);
      replaceExpandedFolderPaths(previous.filter(key => !toRemove.has(key)));
    });
  };

  const contextMenu: ReactNode = (
    <Menu
      open={!!menuState}
      onClose={handleClose}
      anchorReference="anchorPosition"
      anchorPosition={menuState?.anchorPosition}
    >
      {path && (
        <>
          <MenuItem onClick={handleAction(() => void copyToClipboard(path))}>{t('actions.copyPath')}</MenuItem>
          {navigable && (
            <MenuItem onClick={handleAction(() => onShowInGraph(path))}>{t('actions.showInGraph')}</MenuItem>
          )}
          {isFolder && (
            <>
              <MenuItem onClick={handleAction(() => toggleExpand(path))}>
                {expanded ? t('actions.collapse') : t('actions.expand')}
              </MenuItem>
              <MenuItem onClick={handleAction(() => expandRecursive(path))}>{t('actions.expandRecursive')}</MenuItem>
              <MenuItem onClick={handleAction(() => collapseRecursive(path))}>
                {t('actions.collapseRecursive')}
              </MenuItem>
              <MenuItem onClick={handleAction(() => expandToLevel(path))}>{t('actions.expandToLevel')}</MenuItem>
              <MenuItem onClick={handleAction(() => collapseToLevel(path))}>{t('actions.collapseToLevel')}</MenuItem>
            </>
          )}
          {navigable && (
            <MenuItem onClick={handleAction(() => setDependenciesPanelPath(path))}>
              {t('actions.viewDependencies')}
            </MenuItem>
          )}
          {navigable && (
            <MenuItem onClick={handleAction(() => setApplicableRulesPanelPath(path))}>
              {t('actions.viewApplicableRules')}
            </MenuItem>
          )}
          <MenuItem onClick={handleAction(() => onViewModuleJson(path))}>{t('moduleJson.view')}</MenuItem>
        </>
      )}
    </Menu>
  );

  return { openContextMenu, contextMenu };
}
