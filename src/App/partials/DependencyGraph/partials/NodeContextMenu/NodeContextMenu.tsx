import { useCallback, useState, type MouseEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import { copyToClipboard } from '@/Shared';

import { useGraphActions } from '../../contexts';

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
    onHideOthers,
    onShowDirectDependencies,
    onShowDirectDependents,
  } = useGraphActions();
  const [anchorPosition, setAnchorPosition] = useState<{ top: number; left: number } | null>(null);

  const handleContextMenu = useCallback((event: MouseEvent) => {
    event.preventDefault();
    setAnchorPosition({ top: event.clientY, left: event.clientX });
  }, []);

  const handleClose = useCallback(() => {
    setAnchorPosition(null);
  }, []);

  const handleAction = useCallback(
    (action: () => void) => (event: MouseEvent) => {
      event.stopPropagation();
      handleClose();
      action();
    },
    [handleClose],
  );

  return (
    <>
      <span onContextMenu={handleContextMenu}>{children}</span>
      <Menu
        open={anchorPosition !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={anchorPosition ?? undefined}
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
      </Menu>
    </>
  );
}
