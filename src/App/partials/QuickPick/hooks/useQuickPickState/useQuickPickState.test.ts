// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import type { QuickPickCommand } from '../../types';
import { useQuickPickState } from './useQuickPickState';

const SOURCES = ['src/a.ts', 'src/b/c.ts', 'src/utils/helpers.ts'];

const COMMANDS: QuickPickCommand[] = [
  { id: 'selectAll', label: 'Select All', onExecute: vi.fn() },
  { id: 'setTheme', label: 'Set Theme', onExecute: vi.fn() },
  { id: 'about', label: 'About', onExecute: vi.fn() },
];

describe('useQuickPickState', () => {
  it('starts closed with empty query', () => {
    const { result } = renderHook(() => useQuickPickState(SOURCES, COMMANDS));

    expect(result.current.open).toBe(false);
    expect(result.current.query).toBe('');
    expect(result.current.isCommandMode).toBe(false);
  });

  it('openFileMode opens with empty query and no file results until typed', () => {
    const { result } = renderHook(() => useQuickPickState(SOURCES, COMMANDS));

    act(() => {
      result.current.openFileMode();
    });

    expect(result.current.open).toBe(true);
    expect(result.current.query).toBe('');
    expect(result.current.isCommandMode).toBe(false);
    expect(result.current.fileResults).toEqual([]);
    expect(result.current.commandResults).toEqual([]);
    expect(result.current.results).toEqual([]);
  });

  it('openCommandMode opens in command mode', () => {
    const { result } = renderHook(() => useQuickPickState(SOURCES, COMMANDS));

    act(() => {
      result.current.openCommandMode();
    });

    expect(result.current.open).toBe(true);
    expect(result.current.query).toBe('>');
    expect(result.current.isCommandMode).toBe(true);
    expect(result.current.fileResults).toEqual([]);
    expect(result.current.commandResults).toHaveLength(COMMANDS.length);
    expect(result.current.results).toEqual(result.current.commandResults);
  });

  it('toggleFileMode opens then closes and clears query', () => {
    const { result } = renderHook(() => useQuickPickState(SOURCES, COMMANDS));

    act(() => {
      result.current.toggleFileMode();
    });
    expect(result.current.open).toBe(true);

    act(() => {
      result.current.setQuery('helpers');
    });
    expect(result.current.query).toBe('helpers');

    act(() => {
      result.current.toggleFileMode();
    });
    expect(result.current.open).toBe(false);
    expect(result.current.query).toBe('');
  });

  it('close clears query and closes', () => {
    const { result } = renderHook(() => useQuickPickState(SOURCES, COMMANDS));

    act(() => {
      result.current.openCommandMode();
      result.current.setQuery('>theme');
    });

    act(() => {
      result.current.close();
    });

    expect(result.current.open).toBe(false);
    expect(result.current.query).toBe('');
  });

  it('filters file results by query', async () => {
    const { result } = renderHook(() => useQuickPickState(SOURCES, COMMANDS));

    act(() => {
      result.current.openFileMode();
      result.current.setQuery('helpers');
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isCommandMode).toBe(false);
    expect(result.current.results.some(item => 'key' in item && item.key.includes('helpers'))).toBe(true);
  });

  it('filters command results in command mode', () => {
    const { result } = renderHook(() => useQuickPickState(SOURCES, COMMANDS));

    act(() => {
      result.current.openCommandMode();
      result.current.setQuery('>theme');
    });

    expect(result.current.isCommandMode).toBe(true);
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0]).toMatchObject({ id: 'setTheme' });
  });
});
