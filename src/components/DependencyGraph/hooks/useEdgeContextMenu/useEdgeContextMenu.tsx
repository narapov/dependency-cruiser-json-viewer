import { useCallback, useState, type MouseEvent } from 'react'
import type { Edge, EdgeMouseHandler } from '@xyflow/react'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useTranslation } from 'react-i18next'
import { EdgeContextMenuHeader } from '../../partials/EdgeContextMenuHeader'
import { EdgeHighlightSubmenu } from '../../partials/EdgeHighlightSubmenu'

export interface UseEdgeContextMenuOptions {
  onFocusNode: (path: string) => void
  getEdgeHighlight: (edgeId: string) => string | undefined
  onSetUserEdgeHighlight: (edgeId: string, color: string | null) => void
}

export function useEdgeContextMenu({
  onFocusNode,
  getEdgeHighlight,
  onSetUserEdgeHighlight,
}: UseEdgeContextMenuOptions) {
  const { t } = useTranslation()
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
            {t('graph.edgeMenu.viewSource')}
          </MenuItem>
          <MenuItem onClick={handleAction(() => onFocusNode(menuState.edge.target))}>
            {t('graph.edgeMenu.viewTarget')}
          </MenuItem>
          <EdgeHighlightSubmenu
            currentHighlight={getEdgeHighlight(menuState.edge.id)}
            onSetHighlight={(color) => onSetUserEdgeHighlight(menuState.edge.id, color)}
            onClose={handleClose}
          />
        </>
      )}
    </Menu>
  )

  return { onEdgeContextMenu, edgeContextMenu }
}
