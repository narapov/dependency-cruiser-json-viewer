// @vitest-environment jsdom
import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ThemeProvider } from '@mui/material/styles';
import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';

import { appStorageKey } from '@/Shared';
import { muiTheme } from '@/Shared/styles/muiTheme';

import { GraphLegend } from './GraphLegend';

const STORAGE_KEY = appStorageKey('graph-legend-expanded');

function renderWithTheme(ui: ReactElement) {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      {ui}
    </ThemeProvider>,
  );
}

describe('GraphLegend', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('starts expanded by default and collapses on click', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<GraphLegend />);

    expect(screen.getByText(i18n.current.t('graph.legend.incoming'))).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.collapse') }));

    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
    expect(screen.getByRole('button', { name: i18n.current.t('actions.expand') })).toBeInTheDocument();
  });

  it('restores collapsed state from localStorage', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    localStorage.setItem(STORAGE_KEY, 'false');

    renderWithTheme(<GraphLegend />);

    expect(screen.getByRole('button', { name: i18n.current.t('actions.expand') })).toBeInTheDocument();
  });
});
