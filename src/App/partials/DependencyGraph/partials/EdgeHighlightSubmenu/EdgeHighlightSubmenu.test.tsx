// @vitest-environment jsdom
import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Menu from '@mui/material/Menu';
import { ThemeProvider } from '@mui/material/styles';
import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';

import { USER_EDGE_HIGHLIGHT_COLORS } from '@/Shared';
import { muiTheme } from '@/Shared/styles/muiTheme';

import { EdgeHighlightSubmenu } from './EdgeHighlightSubmenu';

function renderWithTheme(ui: ReactElement) {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      {ui}
    </ThemeProvider>,
  );
}

function renderInMenu(ui: ReactElement) {
  const anchor = document.createElement('div');
  document.body.appendChild(anchor);
  return renderWithTheme(
    <Menu open anchorEl={anchor}>
      {ui}
    </Menu>,
  );
}

describe('EdgeHighlightSubmenu', () => {
  afterEach(() => {
    cleanup();
  });

  it('opens color submenu on hover and sets highlight', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onSetHighlight = vi.fn();
    const onClose = vi.fn();

    renderInMenu(
      <EdgeHighlightSubmenu currentHighlight={undefined} onSetHighlight={onSetHighlight} onClose={onClose} />,
    );

    fireEvent.mouseEnter(screen.getByText(i18n.current.t('actions.highlight')));

    const colorItem = screen
      .getAllByRole('menuitem')
      .find(item => item.querySelector('[class*="MuiBox-root"]') && !item.textContent?.includes('Clear'));
    expect(colorItem).toBeInTheDocument();
    fireEvent.click(colorItem!);

    expect(onSetHighlight).toHaveBeenCalledWith(USER_EDGE_HIGHLIGHT_COLORS[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it('shows clear action when highlight is set', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onSetHighlight = vi.fn();
    const onClose = vi.fn();

    renderInMenu(
      <EdgeHighlightSubmenu
        currentHighlight={USER_EDGE_HIGHLIGHT_COLORS[0]}
        onSetHighlight={onSetHighlight}
        onClose={onClose}
      />,
    );

    fireEvent.mouseEnter(screen.getByText(i18n.current.t('actions.highlight')));
    fireEvent.click(screen.getByText(i18n.current.t('actions.clear')));

    expect(onSetHighlight).toHaveBeenCalledWith(null);
    expect(onClose).toHaveBeenCalled();
  });
});
