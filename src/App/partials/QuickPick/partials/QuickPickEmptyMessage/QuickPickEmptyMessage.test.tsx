// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import { renderHook, screen } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { QuickPickEmptyMessage } from './QuickPickEmptyMessage';

describe('QuickPickEmptyMessage', () => {
  it('shows start typing hint for empty file query', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<QuickPickEmptyMessage isCommandMode={false} normalizedQuery="" />);

    expect(screen.getByText(i18n.current.t('quickPick.startTyping'))).toBeInTheDocument();
  });

  it('shows no matching files when file query is non-empty', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<QuickPickEmptyMessage isCommandMode={false} normalizedQuery="xyz" />);

    expect(screen.getByText(i18n.current.t('quickPick.noMatchingFiles'))).toBeInTheDocument();
  });

  it('shows type-to-filter hint for empty command query', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<QuickPickEmptyMessage isCommandMode normalizedQuery="   " />);

    expect(screen.getByText(i18n.current.t('quickPick.typeToFilterCommands'))).toBeInTheDocument();
  });

  it('shows no matching commands when command query is non-empty', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<QuickPickEmptyMessage isCommandMode normalizedQuery="open" />);

    expect(screen.getByText(i18n.current.t('quickPick.noMatchingCommands'))).toBeInTheDocument();
  });
});
