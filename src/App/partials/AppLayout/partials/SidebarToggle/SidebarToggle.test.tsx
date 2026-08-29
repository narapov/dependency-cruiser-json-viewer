// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';

import { formatShortcut } from '@/Shared';
import { renderWithTheme } from '@/testsUtils';

import { SidebarToggle } from './SidebarToggle';

describe('SidebarToggle', () => {
  it('renders files, rules, circular, and highlights buttons and reports view selection', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onSelectView = vi.fn();
    const hideShortcut = formatShortcut('B');
    const rulesShowShortcut = formatShortcut('M', { shift: true });
    const circularShowShortcut = formatShortcut('C', { shift: true });
    const highlightsShowShortcut = formatShortcut('H', { shift: true });

    renderWithTheme(<SidebarToggle sidebarOpen sidebarView="files" onSelectView={onSelectView} />);

    fireEvent.click(
      screen.getByRole('button', { name: i18n.current.t('app.hideFileTree', { shortcut: hideShortcut }) }),
    );
    expect(onSelectView).toHaveBeenCalledWith('files');

    fireEvent.click(
      screen.getByRole('button', { name: i18n.current.t('app.showRules', { shortcut: rulesShowShortcut }) }),
    );
    expect(onSelectView).toHaveBeenCalledWith('rules');

    fireEvent.click(
      screen.getByRole('button', {
        name: i18n.current.t('app.showCircular', { shortcut: circularShowShortcut }),
      }),
    );
    expect(onSelectView).toHaveBeenCalledWith('circular');

    fireEvent.click(
      screen.getByRole('button', {
        name: i18n.current.t('app.showHighlights', { shortcut: highlightsShowShortcut }),
      }),
    );
    expect(onSelectView).toHaveBeenCalledWith('highlights');
  });

  it('marks the active circular view as pressed when sidebar is open', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const hideShortcut = formatShortcut('B');
    const filesShowShortcut = formatShortcut('E', { shift: true });

    renderWithTheme(<SidebarToggle sidebarOpen sidebarView="circular" onSelectView={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: i18n.current.t('app.hideCircular', { shortcut: hideShortcut }) }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: i18n.current.t('app.showFileTree', { shortcut: filesShowShortcut }) }),
    ).toHaveAttribute('aria-pressed', 'false');
  });
});
