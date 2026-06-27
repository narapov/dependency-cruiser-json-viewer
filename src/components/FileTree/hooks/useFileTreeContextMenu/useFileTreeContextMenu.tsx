import { useCallback, useState, type MouseEvent } from 'react'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { copyToClipboard } from '../../../../Shared'

export interface FileTreeContextMenuOptions {
  path: string
  isFolder?: boolean
  expanded?: boolean
  onToggleExpand?: (path: string) => void
  onExpandRecursive?: (path: string) => void
  onShowInGraph?: (path: string) => void
  onShowDependencies?: (path: string) => void
}

export function useFileTreeContextMenu({
  path,
  isFolder = false,
  expanded,
  onToggleExpand,
  onExpandRecursive,
  onShowInGraph,
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
      {onShowInGraph && (
        <MenuItem onClick={handleAction(() => onShowInGraph(path))}>Show in graph</MenuItem>
      )}
      {isFolder && onToggleExpand && (
        <MenuItem onClick={handleAction(() => onToggleExpand(path))}>
          {expanded ? 'Collapse' : 'Expand'}
        </MenuItem>
      )}
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
