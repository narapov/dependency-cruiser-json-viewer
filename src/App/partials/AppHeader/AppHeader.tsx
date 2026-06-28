import TerminalOutlined from '@mui/icons-material/TerminalOutlined'
import SearchOutlined from '@mui/icons-material/SearchOutlined'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { formatShortcut } from '../../../Shared'
import { LanguageSelector } from '../LanguageSelector'
import { ThemeSelector } from '../ThemeSelector'

const headerIconButtonSx = {
  color: 'rgba(255, 255, 255, 0.75)',
  p: 0.5,
  '&:hover': {
    bgcolor: 'rgba(255, 255, 255, 0.08)',
  },
} as const

interface AppHeaderProps {
  moduleCount?: number
  onOpenFileSearch: () => void
  onOpenCommandPalette: () => void
}

export function AppHeader({
  moduleCount,
  onOpenFileSearch,
  onOpenCommandPalette,
}: AppHeaderProps) {
  const { t } = useTranslation()
  const searchFilesLabel = t('app.searchFiles', { shortcut: formatShortcut('P') })
  const commandPaletteLabel = t('app.commandPalette')

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      <Typography
        variant="subtitle1"
        component="h1"
        sx={{ margin: 0, color: 'common.white', fontWeight: 600 }}
      >
        {t('app.title')}
        {moduleCount != null && (
          <Typography
            component="span"
            variant="body2"
            sx={{ marginLeft: 1.5, fontWeight: 400, color: 'rgba(255, 255, 255, 0.65)' }}
          >
            {t('app.modulesCount', { count: moduleCount })}
          </Typography>
        )}
      </Typography>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <Tooltip title={searchFilesLabel}>
          <IconButton
            size="small"
            aria-label={searchFilesLabel}
            onClick={onOpenFileSearch}
            sx={headerIconButtonSx}
          >
            <SearchOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title={commandPaletteLabel}>
          <IconButton
            size="small"
            aria-label={commandPaletteLabel}
            onClick={onOpenCommandPalette}
            sx={headerIconButtonSx}
          >
            <TerminalOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <LanguageSelector />
        <ThemeSelector />
      </Stack>
    </Box>
  )
}
