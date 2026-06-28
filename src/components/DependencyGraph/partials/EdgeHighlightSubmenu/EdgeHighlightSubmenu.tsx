import { useCallback, useState, type MouseEvent } from 'react'
import Box from '@mui/material/Box'
import CheckIcon from '@mui/icons-material/Check'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Divider from '@mui/material/Divider'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { USER_EDGE_HIGHLIGHT_COLORS } from '../../../../Shared'

interface EdgeHighlightSubmenuProps {
  currentHighlight: string | undefined
  onSetHighlight: (color: string | null) => void
  onClose: () => void
}

export function EdgeHighlightSubmenu({
  currentHighlight,
  onSetHighlight,
  onClose,
}: EdgeHighlightSubmenuProps) {
  const [submenuAnchor, setSubmenuAnchor] = useState<HTMLElement | null>(null)

  const handleSubmenuClose = useCallback(() => {
    setSubmenuAnchor(null)
  }, [])

  const handleAction = useCallback(
    (action: () => void) => (event: MouseEvent) => {
      event.stopPropagation()
      handleSubmenuClose()
      onClose()
      action()
    },
    [handleSubmenuClose, onClose],
  )

  return (
    <>
      <MenuItem
        onMouseEnter={(event) => setSubmenuAnchor(event.currentTarget)}
        aria-haspopup="true"
      >
        <ListItemText>Highlight</ListItemText>
        <ChevronRightIcon fontSize="small" sx={{ ml: 2, color: 'text.secondary' }} />
      </MenuItem>
      <Menu
        anchorEl={submenuAnchor}
        open={submenuAnchor != null}
        onClose={handleSubmenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          list: {
            onMouseLeave: handleSubmenuClose,
          },
        }}
      >
        <MenuItem
          disabled={currentHighlight == null}
          onClick={handleAction(() => onSetHighlight(null))}
        >
          Clear highlight
        </MenuItem>
        <Divider />
        {USER_EDGE_HIGHLIGHT_COLORS.map((color) => (
          <MenuItem key={color} onClick={handleAction(() => onSetHighlight(color))}>
            <ListItemIcon sx={{ minWidth: 28 }}>
              {currentHighlight === color ? (
                <CheckIcon fontSize="small" />
              ) : (
                <Box sx={{ width: 20 }} />
              )}
            </ListItemIcon>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: '2px',
                backgroundColor: color,
                border: '1px solid rgba(0, 0, 0, 0.2)',
                flexShrink: 0,
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
