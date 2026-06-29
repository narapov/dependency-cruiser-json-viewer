import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    appHeader: Palette['primary'];
  }
  interface PaletteOptions {
    appHeader?: PaletteOptions['primary'];
  }
}

export const muiTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'data',
  },
  colorSchemes: {
    light: {
      palette: {
        appHeader: { main: '#001529' },
      },
    },
    dark: {
      palette: {
        appHeader: { main: '#001529' },
      },
    },
  },
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
    MuiCssBaseline: {
      styleOverrides: {
        '@global': {
          'body.resizingSidebar, body.resizingPanel': {
            cursor: 'col-resize',
            userSelect: 'none',
          },
        },
      },
    },
  },
});
