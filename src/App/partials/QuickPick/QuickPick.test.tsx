// @vitest-environment jsdom
import { createRef } from 'react';
import { useTranslation } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, fireEvent, renderHook, screen, waitFor, within } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { QuickPick, type QuickPickCommand, type QuickPickHandle } from './QuickPick';

const SOURCES = ['src/a.ts', 'src/b/c.ts', 'src/utils/helpers.ts'];

function getKeyboardRoot(input: HTMLElement) {
  return input.closest('.MuiDialogContent-root')!.firstChild as HTMLElement;
}

describe('QuickPick', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('navigates file results with arrows and selects on Enter', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onSelectPath = vi.fn();
    const ref = createRef<QuickPickHandle>();
    const commands: QuickPickCommand[] = [{ id: 'about', label: 'About', onExecute: vi.fn() }];

    renderWithTheme(<QuickPick ref={ref} sources={SOURCES} commands={commands} onSelectPath={onSelectPath} />);

    act(() => {
      ref.current?.openFileMode();
    });

    const input = screen.getByPlaceholderText(i18n.current.t('quickPick.filePlaceholder'));
    fireEvent.change(input, { target: { value: 'helpers' } });

    await act(async () => {
      await Promise.resolve();
    });

    expect(within(screen.getByRole('listbox')).getAllByRole('option').length).toBeGreaterThan(0);

    const keyboardRoot = getKeyboardRoot(input);
    fireEvent.keyDown(keyboardRoot, { key: 'ArrowDown' });
    fireEvent.keyDown(keyboardRoot, { key: 'Enter' });

    expect(onSelectPath).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('selects highlighted command on Enter and closes', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const onExecute = vi.fn();
    const onSelectPath = vi.fn();
    const ref = createRef<QuickPickHandle>();
    const commands: QuickPickCommand[] = [
      { id: 'selectAll', label: 'Select All', onExecute: vi.fn() },
      { id: 'setTheme', label: 'Set Theme', onExecute },
    ];

    renderWithTheme(<QuickPick ref={ref} sources={SOURCES} commands={commands} onSelectPath={onSelectPath} />);

    act(() => {
      ref.current?.openCommandMode();
    });

    const input = screen.getByPlaceholderText(i18n.current.t('quickPick.commandPlaceholder'));
    fireEvent.change(input, { target: { value: '>theme' } });

    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.keyDown(getKeyboardRoot(input), { key: 'Enter' });

    expect(onExecute).toHaveBeenCalled();
    expect(onSelectPath).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('prevents Tab default and resets highlight when query changes', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const ref = createRef<QuickPickHandle>();
    renderWithTheme(
      <QuickPick
        ref={ref}
        sources={SOURCES}
        commands={[{ id: 'about', label: 'About', onExecute: vi.fn() }]}
        onSelectPath={vi.fn()}
      />,
    );

    act(() => {
      ref.current?.openFileMode();
    });

    const input = screen.getByPlaceholderText(i18n.current.t('quickPick.filePlaceholder'));
    fireEvent.change(input, { target: { value: 'src' } });

    await act(async () => {
      await Promise.resolve();
    });

    const keyboardRoot = getKeyboardRoot(input);
    fireEvent.keyDown(keyboardRoot, { key: 'ArrowDown' });
    fireEvent.keyDown(keyboardRoot, { key: 'ArrowDown' });

    expect(fireEvent.keyDown(keyboardRoot, { key: 'Tab' })).toBe(false);

    fireEvent.change(input, { target: { value: 'helpers' } });
    await act(async () => {
      await Promise.resolve();
    });

    const options = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('resets highlight index when reopened after close', async () => {
    const { result: i18n } = renderHook(() => useTranslation());
    const ref = createRef<QuickPickHandle>();
    const commands: QuickPickCommand[] = [
      { id: 'selectAll', label: 'Select All', onExecute: vi.fn() },
      { id: 'setTheme', label: 'Set Theme', onExecute: vi.fn() },
      { id: 'about', label: 'About', onExecute: vi.fn() },
    ];

    renderWithTheme(<QuickPick ref={ref} sources={SOURCES} commands={commands} onSelectPath={vi.fn()} />);

    act(() => {
      ref.current?.openCommandMode();
    });

    const input = screen.getByPlaceholderText(i18n.current.t('quickPick.commandPlaceholder'));
    const keyboardRoot = getKeyboardRoot(input);
    fireEvent.keyDown(keyboardRoot, { key: 'ArrowDown' });
    fireEvent.keyDown(keyboardRoot, { key: 'ArrowDown' });

    const optionsBeforeClose = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(optionsBeforeClose[2]).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(keyboardRoot, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    act(() => {
      ref.current?.openCommandMode();
    });

    const optionsAfterOpen = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(optionsAfterOpen[0]).toHaveAttribute('aria-selected', 'true');
  });
});
