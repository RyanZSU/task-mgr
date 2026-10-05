import { createTheme } from '@mui/material/styles'

const primary = { main: '#3f51b5' }

export function buildTheme(mode: 'light' | 'dark') {
  return createTheme({
    palette: {
      mode,
      primary,
      ...(mode === 'dark'
        ? {
            background: { default: '#121212', paper: '#1e1e1e' },
          }
        : {
            background: { default: '#fafafa', paper: '#ffffff' },
          }),
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily:
        'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
      h6: { fontWeight: 600 },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { textTransform: 'none' } },
      },
      MuiDialogTitle: {
        styleOverrides: { root: { paddingBottom: 8 } },
      },
    },
  })
}