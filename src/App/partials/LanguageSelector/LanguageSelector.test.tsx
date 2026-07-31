// @vitest-environment jsdom
import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider } from '@mui/material/styles';
import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';

import { muiTheme } from '@/Shared/styles/muiTheme';

import { LanguageSelector } from './LanguageSelector';

function renderWithTheme(ui: ReactElement) {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      {ui}
    </ThemeProvider>,
  );
}

describe('LanguageSelector', () => {
  afterEach(() => {
    cleanup();
  });

  it('opens menu and changes language', async () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<LanguageSelector />);

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('language.label') }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.click(screen.getByText(i18n.current.t('language.de')));

    expect(i18n.current.i18n.language).toBe('de');
  });
});
