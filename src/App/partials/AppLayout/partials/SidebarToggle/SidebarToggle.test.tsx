// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';

import { formatShortcut } from '@/Shared';
import { renderWithTheme } from '@/testsUtils';

import { SidebarToggle } from './SidebarToggle';

describe('SidebarToggle', () => {
  it('renders files and rules buttons and reports view selection', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onSelectView = vi.fn();
    const hideShortcut = formatShortcut('B');
    const rulesShowShortcut = formatShortcut('M', { shift: true });

    renderWithTheme(<SidebarToggle sidebarOpen sidebarView="files" onSelectView={onSelectView} />);

    fireEvent.click(
      screen.getByRole('button', { name: i18n.current.t('app.hideFileTree', { shortcut: hideShortcut }) }),
    );
    expect(onSelectView).toHaveBeenCalledWith('files');

    fireEvent.click(
      screen.getByRole('button', { name: i18n.current.t('app.showRules', { shortcut: rulesShowShortcut }) }),
    );
    expect(onSelectView).toHaveBeenCalledWith('rules');
  });

  it('marks the active rules view as pressed when sidebar is open', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const hideShortcut = formatShortcut('B');
    const filesShowShortcut = formatShortcut('E', { shift: true });

    renderWithTheme(<SidebarToggle sidebarOpen sidebarView="rules" onSelectView={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: i18n.current.t('app.hideRules', { shortcut: hideShortcut }) }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: i18n.current.t('app.showFileTree', { shortcut: filesShowShortcut }) }),
    ).toHaveAttribute('aria-pressed', 'false');
  });
});
