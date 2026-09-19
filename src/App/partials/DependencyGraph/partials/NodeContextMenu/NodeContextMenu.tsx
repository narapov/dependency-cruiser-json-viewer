import { useCallback, useState, type MouseEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import { copyToClipboard } from '@/Shared';

import { useGraphActions } from '../../contexts';
import { NodeContextMenuControlsProvider } from './contexts';

type MenuAnchor = { type: 'position'; top: number; left: number } | { type: 'element'; el: HTMLElement };

interface NodeContextMenuProps {
  path: string;
  isFolder: boolean;
  expanded?: boolean;
  onAutoLayout?: (path: string) => void;
  onAutoLayoutRecursive?: (path: string) => void;
  children: ReactNode;
}

export function NodeContextMenu({
  path,
  isFolder,
  expanded,
  onAutoLayout,
  onAutoLayoutRecursive,
  children,
}: NodeContextMenuProps) {
  const { t } = useTranslation();
  const {
    onToggleFolder,
    onExpandRecursive,
    onShowInFileTree,
    onShowDependenciesPanel,
    onShowApplicableRulesPanel,
    onViewModuleJson,
    onHideOthers,
    onShowDirectDependencies,
    onShowDirectDependents,
  } = useGraphActions();
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);

  const handleContextMenu = useCallback((event: MouseEvent) => {
    event.preventDefault();
    setMenuAnchor({ type: 'position', top: event.clientY, left: event.clientX });
  }, []);

  const openAtElement = useCallback((el: HTMLElement) => {
    setMenuAnchor({ type: 'element', el });
  }, []);

  const handleClose = useCallback(() => {
    setMenuAnchor(null);
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

  return (
    <NodeContextMenuControlsProvider value={{ openAtElement }}>
      <span onContextMenu={handleContextMenu}>{children}</span>
      <Menu
        open={menuAnchor !== null}
        onClose={handleMenuClose}
        anchorReference={menuAnchor?.type === 'element' ? 'anchorEl' : 'anchorPosition'}
        anchorEl={menuAnchor?.type === 'element' ? menuAnchor.el : undefined}
        anchorPosition={menuAnchor?.type === 'position' ? { top: menuAnchor.top, left: menuAnchor.left } : undefined}
        slotProps={{
          backdrop: {
            onMouseDown: stopBackdropPropagation,
            onClick: (event: MouseEvent) => {
              event.stopPropagation();
            },
          },
        }}
      >
        <MenuItem onClick={handleAction(() => void copyToClipboard(path))}>{t('actions.copyPath')}</MenuItem>
        {isFolder && (
          <MenuItem onClick={handleAction(() => onToggleFolder(path))}>
            {expanded ? t('actions.collapse') : t('actions.expand')}
          </MenuItem>
        )}
        {isFolder && (
          <MenuItem onClick={handleAction(() => onExpandRecursive(path))}>{t('actions.expandRecursive')}</MenuItem>
        )}
        {onAutoLayout && (
          <MenuItem onClick={handleAction(() => onAutoLayout(path))}>{t('actions.autoLayout')}</MenuItem>
        )}
        {onAutoLayoutRecursive && (
          <MenuItem onClick={handleAction(() => onAutoLayoutRecursive(path))}>
            {t('actions.autoLayoutRecursive')}
          </MenuItem>
        )}
        <MenuItem onClick={handleAction(() => onShowInFileTree(path))}>{t('actions.showInFileTree')}</MenuItem>
        <MenuItem onClick={handleAction(() => onHideOthers(path))}>{t('actions.hideOthers')}</MenuItem>
        <MenuItem onClick={handleAction(() => onShowDirectDependencies(path))}>
          {t('actions.showDirectDependencies')}
        </MenuItem>
        <MenuItem onClick={handleAction(() => onShowDirectDependents(path))}>
          {t('actions.showDirectDependents')}
        </MenuItem>
        <MenuItem onClick={handleAction(() => onShowDependenciesPanel(path))}>{t('actions.viewDependencies')}</MenuItem>
        <MenuItem onClick={handleAction(() => onShowApplicableRulesPanel(path))}>
          {t('actions.viewApplicableRules')}
        </MenuItem>
        <MenuItem onClick={handleAction(() => onViewModuleJson(path))}>{t('moduleJson.view')}</MenuItem>
      </Menu>
    </NodeContextMenuControlsProvider>
  );
}
