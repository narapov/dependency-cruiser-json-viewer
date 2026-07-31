// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { LanguageSelector } from './LanguageSelector';

describe('LanguageSelector', () => {
  it('opens menu and changes language', async () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<LanguageSelector />);

    fireEvent.click(screen.getByRole('button', { name: i18n.current.t('language.label') }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.click(screen.getByText(i18n.current.t('language.de')));

    expect(i18n.current.i18n.language).toBe('de');
  });
});
