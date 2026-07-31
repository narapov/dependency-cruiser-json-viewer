// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { LanguagePickerDialog } from './LanguagePickerDialog';

describe('LanguagePickerDialog', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('navigates options with arrows and selects on Enter', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onClose = vi.fn();

    renderWithTheme(<LanguagePickerDialog open onClose={onClose} />);

    const listbox = screen.getByRole('listbox', { name: i18n.current.t('language.languageOptions') });
    const keyboardRoot = listbox.parentElement!;

    fireEvent.keyDown(keyboardRoot, { key: 'ArrowDown' });
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(keyboardRoot, { key: 'Enter' });

    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<LanguagePickerDialog open onClose={onClose} />);

    const listbox = screen.getByRole('listbox', { name: i18n.current.t('language.languageOptions') });
    fireEvent.keyDown(listbox.parentElement!, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });

  it('selects language on click', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onClose = vi.fn();

    renderWithTheme(<LanguagePickerDialog open onClose={onClose} />);

    fireEvent.click(screen.getByText(i18n.current.t('language.fr')));

    expect(onClose).toHaveBeenCalled();
    expect(i18n.current.i18n.language).toBe('fr');
  });
});
