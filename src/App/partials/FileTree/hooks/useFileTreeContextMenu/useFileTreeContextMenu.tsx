import { useCallback, useState, type MouseEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import { getCruiseSources, getSubtreeFolderKeys, isPathVisibleInSelectionRecord, toggleExpandedKey } from '@/domain';
import { copyToClipboard } from '@/Shared';

import { presenceRecordToPaths, useWorkspaceStore } from '../../../../stores/workspaceStore';

export interface UseFileTreeContextMenuOptions {
  onShowInGraph: (path: string) => void;
  onViewModuleJson: (path: string) => void;
}

interface MenuState {
  path: string;
  anchorPosition: { top: number; left: number };
}

export function useFileTreeContextMenu(config: UseFileTreeContextMenuOptions) {
  const { onShowInGraph, onViewModuleJson } = config;

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
  const node = path != null ? cruiseSnapshot.nodes.get(path) : undefined;
  const isFolder = node?.isFolder === true;
  const expandedKeys = presenceRecordToPaths(expandedFolderPaths);
  const expanded = path != null && expandedFolderPaths[path] === true;
  const navigable =
    path != null && isPathVisibleInSelectionRecord(path, selectedFilePaths, node?.descendantFiles ?? new Set());

  const toggleExpand = (folderPath: string) => {
    replaceExpandedFolderPaths(toggleExpandedKey(expandedKeys, folderPath));
  };

  const expandRecursive = (folderPath: string) => {
    replaceExpandedFolderPaths([
      ...new Set([...expandedKeys, ...getSubtreeFolderKeys(folderPath, getCruiseSources(cruiseSnapshot))]),
    ]);
  };

  const contextMenu: ReactNode = (
    <Menu
      open={menuState !== null}
      onClose={handleClose}
      anchorReference="anchorPosition"
      anchorPosition={menuState?.anchorPosition}
    >
      {path != null && (
        <>
          <MenuItem onClick={handleAction(() => void copyToClipboard(path))}>{t('actions.copyPath')}</MenuItem>
          {navigable && (
            <MenuItem onClick={handleAction(() => onShowInGraph(path))}>{t('actions.showInGraph')}</MenuItem>
          )}
          {isFolder && (
            <MenuItem onClick={handleAction(() => toggleExpand(path))}>
              {expanded ? t('actions.collapse') : t('actions.expand')}
            </MenuItem>
          )}
          {isFolder && (
            <MenuItem onClick={handleAction(() => expandRecursive(path))}>{t('actions.expandRecursive')}</MenuItem>
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
