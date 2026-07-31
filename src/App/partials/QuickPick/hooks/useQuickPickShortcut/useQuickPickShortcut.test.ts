// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook } from '@testing-library/react';

import { useQuickPickShortcut } from './useQuickPickShortcut';

describe('useQuickPickShortcut', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('opens command mode on F1', () => {
    const onOpenCommandMode = vi.fn();
    renderHook(() =>
      useQuickPickShortcut({
        open: false,
        onToggleFileMode: vi.fn(),
        onOpenCommandMode,
      }),
    );

    fireEvent.keyDown(window, { key: 'F1' });
    expect(onOpenCommandMode).toHaveBeenCalledTimes(1);
  });

  it('toggles file mode on Cmd+P when closed', () => {
    const onToggleFileMode = vi.fn();
    renderHook(() =>
      useQuickPickShortcut({
        open: false,
        onToggleFileMode,
        onOpenCommandMode: vi.fn(),
      }),
    );

    fireEvent.keyDown(window, { key: 'p', metaKey: true });
    expect(onToggleFileMode).toHaveBeenCalledTimes(1);
  });

  it('skips Cmd+P when closed and focus is in an input', () => {
    const onToggleFileMode = vi.fn();
    const input = document.createElement('input');
    document.body.appendChild(input);

    renderHook(() =>
      useQuickPickShortcut({
        open: false,
        onToggleFileMode,
        onOpenCommandMode: vi.fn(),
      }),
    );

    fireEvent.keyDown(input, { key: 'p', metaKey: true });
    expect(onToggleFileMode).not.toHaveBeenCalled();
  });

  it('allows Cmd+P from an input when quick pick is already open', () => {
    const onToggleFileMode = vi.fn();
    const input = document.createElement('input');
    document.body.appendChild(input);

    renderHook(() =>
      useQuickPickShortcut({
        open: true,
        onToggleFileMode,
        onOpenCommandMode: vi.fn(),
      }),
    );

    fireEvent.keyDown(input, { key: 'p', metaKey: true });
    expect(onToggleFileMode).toHaveBeenCalledTimes(1);
  });

  it('toggles on Ctrl+P', () => {
    const onToggleFileMode = vi.fn();
    renderHook(() =>
      useQuickPickShortcut({
        open: false,
        onToggleFileMode,
        onOpenCommandMode: vi.fn(),
      }),
    );

    fireEvent.keyDown(window, { key: 'p', ctrlKey: true });
    expect(onToggleFileMode).toHaveBeenCalledTimes(1);
  });
});
