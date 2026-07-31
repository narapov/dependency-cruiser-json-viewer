import { type ReactElement, type ReactNode } from 'react';

import { ThemeProvider } from '@mui/material/styles';
import { render } from '@testing-library/react';

import { muiTheme } from '@/Shared/styles/muiTheme';

/** Render UI wrapped in the app MUI ThemeProvider (light default). */
export function renderWithTheme(ui: ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <ThemeProvider theme={muiTheme} defaultMode="light">
        {children}
      </ThemeProvider>
    ),
  });
}
