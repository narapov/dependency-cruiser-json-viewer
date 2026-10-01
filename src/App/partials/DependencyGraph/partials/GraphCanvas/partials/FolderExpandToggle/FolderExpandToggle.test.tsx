// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { FolderExpandToggle } from './FolderExpandToggle';

describe('FolderExpandToggle', () => {
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
