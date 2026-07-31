// @vitest-environment jsdom
import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider } from '@mui/material/styles';
import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';

import { muiTheme } from '@/Shared/styles/muiTheme';

import { ThemeSelector } from './ThemeSelector';

function renderWithTheme(ui: ReactElement) {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      {ui}
    </ThemeProvider>,
  );
}

describe('ThemeSelector', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders theme options and selects dark mode', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<ThemeSelector />);

    expect(screen.getByRole('group', { name: i18n.current.t('theme.label') })).toBeInTheDocument();

    const light = screen.getByRole('button', { name: i18n.current.t('theme.light') });
    const dark = screen.getByRole('button', { name: i18n.current.t('theme.dark') });

    expect(light).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(dark);

    expect(dark).toHaveAttribute('aria-pressed', 'true');
    expect(light).toHaveAttribute('aria-pressed', 'false');
  });
});
