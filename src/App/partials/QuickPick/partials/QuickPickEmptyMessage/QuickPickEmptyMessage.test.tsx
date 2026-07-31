// @vitest-environment jsdom
import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import { ThemeProvider } from '@mui/material/styles';
import { render, renderHook, screen } from '@testing-library/react';

import { muiTheme } from '@/Shared/styles/muiTheme';

import { QuickPickEmptyMessage } from './QuickPickEmptyMessage';

function renderWithTheme(ui: ReactElement) {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      {ui}
    </ThemeProvider>,
  );
}

describe('QuickPickEmptyMessage', () => {
  it('shows start typing hint for empty file query', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<QuickPickEmptyMessage isCommandMode={false} normalizedDeferredQuery="" />);

    expect(screen.getByText(i18n.current.t('quickPick.startTyping'))).toBeInTheDocument();
  });

  it('shows no matching files when file query is non-empty', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<QuickPickEmptyMessage isCommandMode={false} normalizedDeferredQuery="xyz" />);

    expect(screen.getByText(i18n.current.t('quickPick.noMatchingFiles'))).toBeInTheDocument();
  });

  it('shows type-to-filter hint for empty command query', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<QuickPickEmptyMessage isCommandMode normalizedDeferredQuery="   " />);

    expect(screen.getByText(i18n.current.t('quickPick.typeToFilterCommands'))).toBeInTheDocument();
  });

  it('shows no matching commands when command query is non-empty', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<QuickPickEmptyMessage isCommandMode normalizedDeferredQuery="open" />);

    expect(screen.getByText(i18n.current.t('quickPick.noMatchingCommands'))).toBeInTheDocument();
  });
});
