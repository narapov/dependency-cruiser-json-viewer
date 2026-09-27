// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { buildCruiseSnapshot } from '@/domain';

import { CruiseSnapshotProvider } from '../../../../contexts';
import type { QuickPickCommand } from '../../types';
import { useQuickPickState } from './useQuickPickState';

const SOURCES = ['src/a.ts', 'src/b/c.ts', 'src/utils/helpers.ts'];

const CRUISE_TREE = buildCruiseSnapshot(
  SOURCES.map(source => ({ source, dependencies: [], dependents: [], valid: true })),
);

const COMMANDS: QuickPickCommand[] = [
  { id: 'selectAll', label: 'Select All', onExecute: vi.fn() },
  { id: 'setTheme', label: 'Set Theme', onExecute: vi.fn() },
  { id: 'about', label: 'About', onExecute: vi.fn() },
];

function wrapper(props: { children: ReactNode }) {
  return <CruiseSnapshotProvider value={CRUISE_TREE}>{props.children}</CruiseSnapshotProvider>;
}

describe('useQuickPickState', () => {
  it('starts closed with empty query', () => {
    const { result } = renderHook(() => useQuickPickState(COMMANDS), { wrapper });

    expect(result.current.open).toBe(false);
    expect(result.current.query).toBe('');
    expect(result.current.isCommandMode).toBe(false);
  });

  it('openFileMode opens with empty query and no file results until typed', () => {
    const { result } = renderHook(() => useQuickPickState(COMMANDS), { wrapper });

    act(() => {
      result.current.openFileMode();
    });

    expect(result.current.open).toBe(true);
    expect(result.current.query).toBe('');
    expect(result.current.fileResults).toEqual([]);
  });

  it('filters files when query is typed in file mode', () => {
    const { result } = renderHook(() => useQuickPickState(COMMANDS), { wrapper });

    act(() => {
      result.current.openFileMode();
      result.current.setQuery('helpers');
    });

    expect(result.current.fileResults.map(item => item.key)).toEqual(['src/utils/helpers.ts']);
  });

  it('openCommandMode opens with > prefix and ranks recent commands first', () => {
    const { result } = renderHook(() => useQuickPickState(COMMANDS, ['setTheme', 'about']), { wrapper });

    act(() => {
      result.current.openCommandMode();
    });

    expect(result.current.open).toBe(true);
    expect(result.current.isCommandMode).toBe(true);
    expect(result.current.commandResults.map(command => command.id)).toEqual(['setTheme', 'about', 'selectAll']);
  });

  it('toggleFileMode opens when closed and closes when open', () => {
    const { result } = renderHook(() => useQuickPickState(COMMANDS), { wrapper });

    act(() => {
      result.current.toggleFileMode();
    });
    expect(result.current.open).toBe(true);

    act(() => {
      result.current.toggleFileMode();
    });
    expect(result.current.open).toBe(false);
  });

  it('close resets query', () => {
    const { result } = renderHook(() => useQuickPickState(COMMANDS), { wrapper });

    act(() => {
      result.current.openFileMode();
      result.current.setQuery('foo');
    });
    act(() => {
      result.current.close();
    });

    expect(result.current.open).toBe(false);
    expect(result.current.query).toBe('');
  });

  it('switches to command mode when query starts with >', () => {
    const { result } = renderHook(() => useQuickPickState(COMMANDS), { wrapper });

    act(() => {
      result.current.openFileMode();
      result.current.setQuery('>about');
    });

    expect(result.current.isCommandMode).toBe(true);
    expect(result.current.normalizedQuery).toBe('about');
    expect(result.current.commandResults.map(command => command.id)).toEqual(['about']);
  });

  it('keeps command mode when query is only >', () => {
    const { result } = renderHook(() => useQuickPickState(COMMANDS), { wrapper });

    act(() => {
      result.current.openCommandMode();
    });

    expect(result.current.isCommandMode).toBe(true);
    expect(result.current.normalizedQuery).toBe('');
  });
});
