// @vitest-environment jsdom

import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import Menu from '@mui/material/Menu';
import { fireEvent, renderHook, screen } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { USER_EDGE_HIGHLIGHT_COLORS } from '../../helpers/graphTheme';
import { EdgeHighlightSubmenu } from './EdgeHighlightSubmenu';

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
