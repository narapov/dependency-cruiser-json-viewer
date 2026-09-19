// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { RECENT_COMMANDS_STORAGE_KEY } from '../../helpers/recentCommandIds';
import { useRecentCommandIds } from './useRecentCommandIds';

describe('useRecentCommandIds', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('initializes from localStorage', () => {
    localStorage.setItem(RECENT_COMMANDS_STORAGE_KEY, JSON.stringify(['about', 'setTheme']));

    const { result } = renderHook(() => useRecentCommandIds());

    expect(result.current.recentIds).toEqual(['about', 'setTheme']);
  });

  it('records usage by moving id to front and persisting', () => {
    localStorage.setItem(RECENT_COMMANDS_STORAGE_KEY, JSON.stringify(['about', 'setTheme']));

    const { result } = renderHook(() => useRecentCommandIds());

    act(() => {
      result.current.recordCommandUsage('setTheme');
    });

    expect(result.current.recentIds).toEqual(['setTheme', 'about']);
    expect(localStorage.getItem(RECENT_COMMANDS_STORAGE_KEY)).toBe(JSON.stringify(['setTheme', 'about']));
  });

  it('persists synchronously so a later clear in the same turn wins', () => {
    localStorage.setItem(RECENT_COMMANDS_STORAGE_KEY, JSON.stringify(['about']));

    const { result } = renderHook(() => useRecentCommandIds());

    act(() => {
      result.current.recordCommandUsage('setTheme');
      localStorage.clear();
    });

    expect(localStorage.getItem(RECENT_COMMANDS_STORAGE_KEY)).toBeNull();
  });
});
