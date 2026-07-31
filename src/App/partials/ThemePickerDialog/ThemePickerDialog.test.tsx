// @vitest-environment jsdom
import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, renderHook, screen } from '@testing-library/react';

import { muiTheme } from '@/Shared/styles/muiTheme';

import { ThemePickerDialog } from './ThemePickerDialog';

function renderWithTheme(ui: ReactElement) {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      {ui}
    </ThemeProvider>,
  );
}

describe('ThemePickerDialog', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('navigates options with arrows and selects on Enter', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onClose = vi.fn();

    renderWithTheme(<ThemePickerDialog open onClose={onClose} />);

    const listbox = screen.getByRole('listbox', { name: i18n.current.t('theme.themeOptions') });
    const keyboardRoot = listbox.parentElement!;

    fireEvent.keyDown(keyboardRoot, { key: 'ArrowDown' });
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(keyboardRoot, { key: 'Enter' });

    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<ThemePickerDialog open onClose={onClose} />);

    const listbox = screen.getByRole('listbox', { name: i18n.current.t('theme.themeOptions') });
    fireEvent.keyDown(listbox.parentElement!, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });

  it('selects option on click', () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onClose = vi.fn();

    renderWithTheme(<ThemePickerDialog open onClose={onClose} />);

    fireEvent.click(screen.getByText(i18n.current.t('theme.dark')));

    expect(onClose).toHaveBeenCalled();
  });
});
