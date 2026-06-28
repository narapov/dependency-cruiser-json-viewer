import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { ThemeSelector } from '../ThemeSelector'

export function AppHeader({ moduleCount }: { moduleCount?: number }) {
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
        Deps Viewer
        {moduleCount != null && (
          <Typography
            component="span"
            variant="body2"
            sx={{ marginLeft: 1.5, fontWeight: 400, color: 'rgba(255, 255, 255, 0.65)' }}
          >
            {moduleCount} modules
          </Typography>
        )}
      </Typography>
      <ThemeSelector />
    </Box>
  )
}
