import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import IconButton from '@mui/material/IconButton'
import type { MouseEvent } from 'react'

interface FolderExpandToggleProps {
  expanded: boolean
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
}

export function FolderExpandToggle({ expanded, onClick }: FolderExpandToggleProps) {
  return (
    <IconButton
      size="small"
      aria-label={expanded ? 'Collapse folder' : 'Expand folder'}
      onClick={onClick}
      sx={{
        width: 16,
        height: 16,
      }}
    >
      {expanded ? <ExpandMoreIcon sx={{ fontSize: 14 }} /> : <ChevronRightIcon sx={{ fontSize: 14 }} />}
    </IconButton>
  )
}
