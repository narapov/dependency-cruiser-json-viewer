// @vitest-environment jsdom
import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '@mui/material/styles';
import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';

import { muiTheme } from '@/Shared/styles/muiTheme';

import { DependencyPanelHeader } from './DependencyPanelHeader';

function renderWithTheme(ui: ReactElement) {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      {ui}
    </ThemeProvider>,
  );
}

describe('DependencyPanelHeader', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders path and invokes actions', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onClose = vi.fn();
    const onShowInGraph = vi.fn();

    renderWithTheme(<DependencyPanelHeader path="src/foo/a.ts" onClose={onClose} onShowInGraph={onShowInGraph} />);

    expect(screen.getByText('src/foo/a.ts')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.showInGraph') }));
    expect(onShowInGraph).toHaveBeenCalledWith('src/foo/a.ts');

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('actions.close') }));
    expect(onClose).toHaveBeenCalled();
  });
});
