import { useCallback, useState, type MouseEvent } from 'react'
import type { Edge, EdgeMouseHandler } from '@xyflow/react'
import Box from '@mui/material/Box'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

const pathSx = {
  display: 'block',
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  direction: 'rtl',
  textAlign: 'left',
  fontFamily: 'monospace',
  fontSize: 12,
} as const

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
          <Box
            role="presentation"
            sx={{
              display: 'grid',
              gridTemplateColumns: 'auto auto auto',
              alignItems: 'center',
              columnGap: 0.5,
              px: 2,
              pt: 1,
              pb: 0.5,
              whiteSpace: 'nowrap',
            }}
          >
            <Box component="span" sx={{ ...pathSx, minWidth: 0 }} title={menuState.edge.source}>
              {menuState.edge.source}
            </Box>
            <Box
              aria-hidden
              sx={{
                color: 'text.secondary',
                fontSize: 12,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              →
            </Box>
            <Box component="span" sx={{ ...pathSx, minWidth: 0 }} title={menuState.edge.target}>
              {menuState.edge.target}
            </Box>
          </Box>
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
