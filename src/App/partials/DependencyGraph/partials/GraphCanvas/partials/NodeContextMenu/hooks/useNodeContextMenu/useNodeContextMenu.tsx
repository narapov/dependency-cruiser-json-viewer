import { useCallback, useState, type MouseEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import { copyToClipboard } from '@/Shared';

import { useWorkspaceStore } from '../../../../../../../../stores/workspaceStore';
import { useGraphWorkspaceActions } from '../../../../hooks';

type MenuAnchor = { type: 'position'; top: number; left: number } | { type: 'element'; el: HTMLElement };

interface MenuState {
  path: string;
  anchor: MenuAnchor;
}

export interface UseNodeContextMenuOptions {
  onShowInFileTree: (path: string) => void;
  onViewModuleJson: (path: string) => void;
  promptFolderLevel: (paths: readonly string[]) => Promise<number | null>;
  onAutoLayoutGroup?: (groupId: string) => void;
  onAutoLayoutGroupRecursive?: (groupId: string) => void;
}

export function useNodeContextMenu(config: UseNodeContextMenuOptions) {
  const { onShowInFileTree, onViewModuleJson, promptFolderLevel, onAutoLayoutGroup, onAutoLayoutGroupRecursive } =
    config;

  const { t } = useTranslation();
  const [menuState, setMenuState] = useState<MenuState | null>(null);

  const cruiseSnapshot = useWorkspaceStore(state => state.cruiseSnapshot);
  const expandedFolderPaths = useWorkspaceStore(state => state.expandedFolderPaths);
  const {
    toggleFolder,
    expandRecursive,
    collapseRecursive,
    expandToLevel,
    collapseToLevel,
    showDependenciesPanel,
    showApplicableRulesPanel,
    hideOthers,
    showDirectDependencies,
    showDirectDependents,
  } = useGraphWorkspaceActions();

  const openContextMenu = useCallback((event: MouseEvent, path: string) => {
    event.preventDefault();
    setMenuState({
      path,
      anchor: { type: 'position', top: event.clientY, left: event.clientX },
    });
  }, []);

  const openAtElement = useCallback((el: HTMLElement, path: string) => {
    setMenuState({
      path,
      anchor: { type: 'element', el },
    });
  }, []);

  const handleClose = useCallback(() => {
    setMenuState(null);
  }, []);

  const handleMenuClose = useCallback(
    (event: Partial<{ stopPropagation: () => void }>) => {
      event.stopPropagation?.();
      handleClose();
    },
    [handleClose],
  );

  const handleAction = useCallback(
    (action: () => void) => (event: MouseEvent) => {
      event.stopPropagation();
      handleClose();
      action();
    },
    [handleClose],
  );

  const stopBackdropPropagation = useCallback((event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
  }, []);

  const path = menuState?.path;
  const node = path ? cruiseSnapshot.nodes.get(path) : undefined;
  const isFolder = node?.isFolder === true;
  const expanded = path && expandedFolderPaths[path] === true;
  const showAutoLayout = isFolder && expanded && onAutoLayoutGroup;
  const showAutoLayoutRecursive = isFolder && expanded && onAutoLayoutGroupRecursive;

  const contextMenu: ReactNode = (
    <Menu
      open={!!menuState}
      onClose={handleMenuClose}
      anchorReference={menuState?.anchor.type === 'element' ? 'anchorEl' : 'anchorPosition'}
      anchorEl={menuState?.anchor.type === 'element' ? menuState.anchor.el : undefined}
      anchorPosition={
        menuState?.anchor.type === 'position' ? { top: menuState.anchor.top, left: menuState.anchor.left } : undefined
      }
      slotProps={{
        backdrop: {
          onMouseDown: stopBackdropPropagation,
          onClick: (event: MouseEvent) => {
            event.stopPropagation();
          },
        },
      }}
    >
      {path && (
        <>
          <MenuItem onClick={handleAction(() => void copyToClipboard(path))}>{t('actions.copyPath')}</MenuItem>
          {isFolder && (
            <>
              <MenuItem onClick={handleAction(() => toggleFolder(path))}>
                {expanded ? t('actions.collapse') : t('actions.expand')}
              </MenuItem>
              <MenuItem onClick={handleAction(() => expandRecursive(path))}>{t('actions.expandRecursive')}</MenuItem>
              <MenuItem onClick={handleAction(() => collapseRecursive(path))}>
                {t('actions.collapseRecursive')}
              </MenuItem>
              <MenuItem
                onClick={handleAction(() => {
                  void promptFolderLevel([path]).then(level => {
                    if (level != null) {
                      expandToLevel(path, level);
                    }
                  });
                })}
              >
                {t('actions.expandToLevel')}
              </MenuItem>
              <MenuItem
                onClick={handleAction(() => {
                  void promptFolderLevel([path]).then(level => {
                    if (level != null) {
                      collapseToLevel(path, level);
                    }
                  });
                })}
              >
                {t('actions.collapseToLevel')}
              </MenuItem>
            </>
          )}
          {showAutoLayout && (
            <MenuItem onClick={handleAction(() => onAutoLayoutGroup(path))}>{t('actions.autoLayout')}</MenuItem>
          )}
          {showAutoLayoutRecursive && (
            <MenuItem onClick={handleAction(() => onAutoLayoutGroupRecursive(path))}>
              {t('actions.autoLayoutRecursive')}
            </MenuItem>
          )}
          <MenuItem onClick={handleAction(() => onShowInFileTree(path))}>{t('actions.showInFileTree')}</MenuItem>
          <MenuItem onClick={handleAction(() => hideOthers(path))}>{t('actions.hideOthers')}</MenuItem>
          <MenuItem onClick={handleAction(() => showDirectDependencies(path))}>
            {t('actions.showDirectDependencies')}
          </MenuItem>
          <MenuItem onClick={handleAction(() => showDirectDependents(path))}>
            {t('actions.showDirectDependents')}
          </MenuItem>
          <MenuItem onClick={handleAction(() => showDependenciesPanel(path))}>{t('actions.viewDependencies')}</MenuItem>
          <MenuItem onClick={handleAction(() => showApplicableRulesPanel(path))}>
            {t('actions.viewApplicableRules')}
          </MenuItem>
          <MenuItem onClick={handleAction(() => onViewModuleJson(path))}>{t('moduleJson.view')}</MenuItem>
        </>
      )}
    </Menu>
  );

  return { openContextMenu, openAtElement, contextMenu };
}
