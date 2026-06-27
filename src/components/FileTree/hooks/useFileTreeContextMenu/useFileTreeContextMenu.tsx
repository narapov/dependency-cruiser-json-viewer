import { useCallback, useState, type MouseEvent } from 'react'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { copyToClipboard } from '../../../../Shared'

export interface FileTreeContextMenuOptions {
  path: string
  isFolder?: boolean
  onExpandRecursive?: (path: string) => void
  onShowDependencies?: (path: string) => void
}

export function useFileTreeContextMenu({
  path,
  isFolder = false,
  onExpandRecursive,
  onShowDependencies,
}: FileTreeContextMenuOptions) {
  const [anchorPosition, setAnchorPosition] = useState<{ top: number; left: number } | null>(
    null,
  )

  const onContextMenu = useCallback((event: MouseEvent) => {
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

  const contextMenu = (
    <Menu
      open={anchorPosition !== null}
      onClose={handleClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition ?? undefined}
    >
      <MenuItem onClick={handleAction(() => void copyToClipboard(path))}>Copy</MenuItem>
      {isFolder && onExpandRecursive && (
        <MenuItem onClick={handleAction(() => onExpandRecursive(path))}>
          Expand recursive
        </MenuItem>
      )}
      {onShowDependencies && (
        <MenuItem onClick={handleAction(() => onShowDependencies(path))}>
          View dependencies
        </MenuItem>
      )}
    </Menu>
  )

  return { onContextMenu, contextMenu }
}
