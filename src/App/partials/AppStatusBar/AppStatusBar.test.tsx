// @vitest-environment jsdom
import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '@mui/material/styles';
import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';

import { muiTheme } from '@/Shared/styles/muiTheme';

import { AppStatusBar } from './AppStatusBar';

vi.mock('@/Shared', async importOriginal => {
  const actual = await importOriginal<typeof import('@/Shared')>();
  return {
    ...actual,
    copyToClipboard: vi.fn(() => Promise.resolve()),
  };
});

function renderWithTheme(ui: ReactElement) {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      {ui}
    </ThemeProvider>,
  );
}

describe('AppStatusBar', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows no-selection label without action buttons', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<AppStatusBar activePath={null} onFocusActivePath={vi.fn()} onShowDependencies={vi.fn()} />);

    expect(screen.getByText(i18n.current.t('statusBar.noSelection'))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: i18n.current.t('actions.copyPath') })).not.toBeInTheDocument();
  });

  it('renders path and invokes focus, dependencies, and copy actions', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onFocusActivePath = vi.fn();
    const onShowDependencies = vi.fn();
    const { copyToClipboard } = await import('@/Shared');

    renderWithTheme(
      <AppStatusBar
        activePath="src/foo/a.ts"
        onFocusActivePath={onFocusActivePath}
        onShowDependencies={onShowDependencies}
      />,
    );

    expect(screen.getByText('src/foo/a.ts')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.showInGraphAndFileTree') }));
    expect(onFocusActivePath).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.viewDependencies') }));
    expect(onShowDependencies).toHaveBeenCalledWith('src/foo/a.ts');

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.copyPath') }));
    expect(copyToClipboard).toHaveBeenCalledWith('src/foo/a.ts');
  });
});
