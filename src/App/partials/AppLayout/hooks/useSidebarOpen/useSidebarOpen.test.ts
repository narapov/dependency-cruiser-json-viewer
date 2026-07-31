// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

import { STORAGE_KEY, useSidebarOpen } from './useSidebarOpen';

describe('useSidebarOpen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('defaults to open when storage is empty', () => {
    const { result } = renderHook(() => useSidebarOpen());
    expect(result.current.sidebarOpen).toBe(true);
  });

  it('reads persisted closed state', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(false));
    const { result } = renderHook(() => useSidebarOpen());
    expect(result.current.sidebarOpen).toBe(false);
  });

  it('toggles and persists sidebar open state', () => {
    const { result } = renderHook(() => useSidebarOpen());

    act(() => {
      result.current.toggleSidebarOpen();
    });

    expect(result.current.sidebarOpen).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');

    act(() => {
      result.current.toggleSidebarOpen();
    });

    expect(result.current.sidebarOpen).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
  });

  it('setSidebarOpen writes the given value', () => {
    const { result } = renderHook(() => useSidebarOpen());

    act(() => {
      result.current.setSidebarOpen(false);
    });

    expect(result.current.sidebarOpen).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
  });
});
