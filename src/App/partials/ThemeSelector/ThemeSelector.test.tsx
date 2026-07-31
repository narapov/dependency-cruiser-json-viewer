// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { ThemeSelector } from './ThemeSelector';

describe('ThemeSelector', () => {
  it('renders theme options and selects dark mode', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<ThemeSelector />);

    expect(screen.getByRole('group', { name: i18n.current.t('theme.label') })).toBeInTheDocument();

    const light = screen.getByRole('button', { name: i18n.current.t('theme.light') });
    const dark = screen.getByRole('button', { name: i18n.current.t('theme.dark') });

    expect(light).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(dark);

    expect(dark).toHaveAttribute('aria-pressed', 'true');
    expect(light).toHaveAttribute('aria-pressed', 'false');
  });
});
