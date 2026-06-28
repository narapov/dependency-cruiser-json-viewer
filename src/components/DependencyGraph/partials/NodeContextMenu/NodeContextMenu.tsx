import { useCallback, useState, type MouseEvent, type ReactNode } from 'react'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useTranslation } from 'react-i18next'
import { copyToClipboard } from '../../../../Shared'

interface NodeContextMenuProps {
  path: string
  isFolder: boolean
  expanded?: boolean
  onToggle?: (path: string) => void
  onExpandRecursive?: (path: string) => void
  onShowInFileTree: (path: string) => void
  onShowDependencies?: (path: string) => void
  children: ReactNode
}

export function NodeContextMenu({
  path,
  isFolder,
  expanded,
  onToggle,
  onExpandRecursive,
  onShowInFileTree,
  onShowDependencies,
  children,
}: NodeContextMenuProps) {
  const { t } = useTranslation()
  const [anchorPosition, setAnchorPosition] = useState<{ top: number; left: number } | null>(
    null,
  )

  const handleContextMenu = useCallback((event: MouseEvent) => {
    event.preventDefault()
    setAnchorPosition({ top: event.clientY, left: event.clientX })
  }, [])

  const handleClose = useCallback(() => {
    setAnchorPosition(null)
  }, [])

  const handleAction = useCallback(
    (action: () => void) => (event: MouseEvent) => {
      event.stopPropagation()
      handleClose()
      action()
    },
    [handleClose],
  )

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
        {isFolder && onToggle && (
          <MenuItem onClick={handleAction(() => onToggle(path))}>
            {expanded ? t('actions.collapse') : t('actions.expand')}
          </MenuItem>
        )}
        {isFolder && onExpandRecursive && (
          <MenuItem onClick={handleAction(() => onExpandRecursive(path))}>
            {t('actions.expandRecursive')}
          </MenuItem>
        )}
        <MenuItem onClick={handleAction(() => onShowInFileTree(path))}>
          {t('actions.showInFileTree')}
        </MenuItem>
        {onShowDependencies && (
          <MenuItem onClick={handleAction(() => onShowDependencies(path))}>
            {t('actions.viewDependencies')}
          </MenuItem>
        )}
      </Menu>
    </>
  )
}
