import { useCallback, useState, type MouseEvent } from 'react'
import Box from '@mui/material/Box'
import CheckIcon from '@mui/icons-material/Check'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
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
            sx: {
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 0.5,
              p: 1,
            },
          },
        }}
      >
        {USER_EDGE_HIGHLIGHT_COLORS.map((color) => (
          <MenuItem
            key={color}
            onClick={handleAction(() => onSetHighlight(color))}
            sx={{ p: 0.5, minHeight: 0, justifyContent: 'center' }}
          >
            <Box
              sx={{
                position: 'relative',
                width: 16,
                height: 16,
                borderRadius: '2px',
                backgroundColor: color,
                border: '1px solid rgba(0, 0, 0, 0.2)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {currentHighlight === color && (
                <CheckIcon sx={{ fontSize: 14, color: 'common.white', filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.8))' }} />
              )}
            </Box>
          </MenuItem>
        ))}
        {currentHighlight != null && (
          <MenuItem
            onClick={handleAction(() => onSetHighlight(null))}
            sx={{ gridColumn: '1 / -1', justifyContent: 'center', mt: 0.5 }}
          >
            Clear
          </MenuItem>
        )}
      </Menu>
    </>
  )
}
