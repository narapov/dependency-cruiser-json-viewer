import { useCallback, useState, type MouseEvent } from 'react'
import type { Edge, EdgeMouseHandler } from '@xyflow/react'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { EdgeContextMenuHeader } from '../../partials/EdgeContextMenuHeader'

export interface UseEdgeContextMenuOptions {
  onFocusNode: (path: string) => void
}

export function useEdgeContextMenu({ onFocusNode }: UseEdgeContextMenuOptions) {
  const [menuState, setMenuState] = useState<{
    anchorPosition: { top: number; left: number }
    edge: Edge
  } | null>(null)

  const handleClose = useCallback(() => {
    setMenuState(null)
  }, [])

  const handleAction = useCallback(
    (action: () => void) => (event: MouseEvent) => {
      event.stopPropagation()
      handleClose()
      action()
    },
    [handleClose],
  )

  const onEdgeContextMenu: EdgeMouseHandler = useCallback((event, edge) => {
    event.preventDefault()
    setMenuState({
      anchorPosition: { top: event.clientY, left: event.clientX },
      edge,
    })
  }, [])

  const edgeContextMenu = (
    <Menu
      open={menuState !== null}
      onClose={handleClose}
      anchorReference="anchorPosition"
      anchorPosition={menuState?.anchorPosition}
      slotProps={{ paper: { sx: { maxWidth: 500 } } }}
    >
      {menuState && (
        <>
          <EdgeContextMenuHeader
            source={menuState.edge.source}
            target={menuState.edge.target}
          />
          <MenuItem onClick={handleAction(() => onFocusNode(menuState.edge.source))}>
            View source
          </MenuItem>
          <MenuItem onClick={handleAction(() => onFocusNode(menuState.edge.target))}>
            View target
          </MenuItem>
        </>
      )}
    </Menu>
  )

  return { onEdgeContextMenu, edgeContextMenu }
}
