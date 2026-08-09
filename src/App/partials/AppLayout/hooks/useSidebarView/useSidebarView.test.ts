// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { STORAGE_KEY, useSidebarView } from './useSidebarView';

describe('useSidebarView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to files when storage is empty', () => {
    const { result } = renderHook(() => useSidebarView());
    expect(result.current.sidebarView).toBe('files');
  });

  it('reads persisted rules view', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify('rules'));
    const { result } = renderHook(() => useSidebarView());
    expect(result.current.sidebarView).toBe('rules');
  });

  it('falls back to files for invalid stored values', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify('bogus'));
    const { result } = renderHook(() => useSidebarView());
    expect(result.current.sidebarView).toBe('files');
  });

  it('setSidebarView writes the given value', () => {
    const { result } = renderHook(() => useSidebarView());

    act(() => {
      result.current.setSidebarView('rules');
    });

    expect(result.current.sidebarView).toBe('rules');
    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify('rules'));
  });
});
