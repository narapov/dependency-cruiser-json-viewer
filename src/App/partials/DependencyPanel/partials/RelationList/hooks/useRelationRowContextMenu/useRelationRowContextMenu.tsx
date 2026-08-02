import { useCallback, useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import { copyToClipboard, EdgeHighlightSubmenu } from '@/Shared';

export interface RelationRowContextMenuOptions {
  path: string;
  onShowInGraph: (path: string) => void;
  highlightEnabled?: boolean;
  currentHighlight?: string;
  onSetHighlight?: (color: string | null) => void;
}

export function useRelationRowContextMenu({
  path,
  onShowInGraph,
  highlightEnabled = false,
  currentHighlight,
  onSetHighlight,
}: RelationRowContextMenuOptions) {
  const { t } = useTranslation();
  const [anchorPosition, setAnchorPosition] = useState<{ top: number; left: number } | null>(null);

  const onContextMenu = useCallback((event: MouseEvent) => {
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

  const contextMenu = (
    <Menu
      open={anchorPosition !== null}
      onClose={handleClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition ?? undefined}
    >
      <MenuItem onClick={handleAction(() => void copyToClipboard(path))}>{t('actions.copyPath')}</MenuItem>
      <MenuItem onClick={handleAction(() => onShowInGraph(path))}>{t('actions.showInGraph')}</MenuItem>
      {highlightEnabled && onSetHighlight != null ? (
        <EdgeHighlightSubmenu
          currentHighlight={currentHighlight}
          onSetHighlight={onSetHighlight}
          onClose={handleClose}
        />
      ) : null}
    </Menu>
  );

  return { onContextMenu, contextMenu };
}
