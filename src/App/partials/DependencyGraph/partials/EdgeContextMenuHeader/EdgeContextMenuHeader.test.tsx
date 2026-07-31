// @vitest-environment jsdom
import { type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';

import { muiTheme } from '@/Shared/styles/muiTheme';

import { EdgeContextMenuHeader } from './EdgeContextMenuHeader';

function renderWithTheme(ui: ReactElement) {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      {ui}
    </ThemeProvider>,
  );
}

describe('EdgeContextMenuHeader', () => {
  it('renders source and target paths', () => {
    renderWithTheme(<EdgeContextMenuHeader source="src/a.ts" target="src/b.ts" />);

    expect(screen.getByText('src/a.ts')).toBeInTheDocument();
    expect(screen.getByText('src/b.ts')).toBeInTheDocument();
    expect(screen.getByText('→')).toBeInTheDocument();
  });
});
