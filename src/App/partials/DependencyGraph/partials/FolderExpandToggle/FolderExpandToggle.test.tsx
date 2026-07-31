// @vitest-environment jsdom
import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '@mui/material/styles';
import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';

import { muiTheme } from '@/Shared/styles/muiTheme';

import { FolderExpandToggle } from './FolderExpandToggle';

function renderWithTheme(ui: ReactElement) {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      {ui}
    </ThemeProvider>,
  );
}

describe('FolderExpandToggle', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows expand label when collapsed and invokes onClick', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onClick = vi.fn();

    renderWithTheme(<FolderExpandToggle expanded={false} onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.expandFolder') }));
    expect(onClick).toHaveBeenCalled();
  });

  it('shows collapse label when expanded', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<FolderExpandToggle expanded onClick={vi.fn()} />);

    expect(screen.getByRole('button', { name: i18n.current.t('actions.collapseFolder') })).toBeInTheDocument();
  });
});
