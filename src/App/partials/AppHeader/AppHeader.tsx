import Typography from '@mui/material/Typography'

export function AppHeader({ moduleCount }: { moduleCount?: number }) {
  return (
    <Typography variant="subtitle1" component="h1" sx={{ margin: 0, color: '#fff', fontWeight: 600 }}>
      Deps Viewer
      {moduleCount != null && (
        <Typography
          component="span"
          variant="body2"
          color="text.secondary"
          sx={{ marginLeft: 1.5, fontWeight: 400 }}
        >
          {moduleCount} modules
        </Typography>
      )}
    </Typography>
  )
}
