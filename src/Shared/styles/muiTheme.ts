import { createTheme } from '@mui/material/styles'

export const muiTheme = createTheme({
  components: {
    MuiButton: { defaultProps: { size: 'small' } },
    MuiIconButton: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        sizeSmall: { padding: 4 },
      },
    },
    MuiCheckbox: { defaultProps: { size: 'small' } },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiFormControlLabel: {
      defaultProps: { slotProps: { typography: { variant: 'body2' } } },
    },
    MuiMenuItem: { defaultProps: { dense: true } },
    MuiListItem: { defaultProps: { dense: true } },
  },
})
