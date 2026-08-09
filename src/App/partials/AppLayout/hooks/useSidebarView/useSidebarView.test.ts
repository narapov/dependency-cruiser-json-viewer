// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { STORAGE_KEY, useSidebarView, type SidebarView } from './useSidebarView';

describe('useSidebarView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it.each([
    { stored: null, expected: 'files' as const },
    { stored: 'rules', expected: 'rules' as const },
    { stored: 'circular', expected: 'circular' as const },
    { stored: 'bogus', expected: 'files' as const },
  ])('resolves stored value $stored to $expected', ({ stored, expected }) => {
    if (stored != null) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }

    const { result } = renderHook(() => useSidebarView());
    expect(result.current.sidebarView).toBe(expected);
  });

  it('setSidebarView writes the given value', () => {
    const { result } = renderHook(() => useSidebarView());

    act(() => {
      result.current.setSidebarView('circular' satisfies SidebarView);
    });

    expect(result.current.sidebarView).toBe('circular');
    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify('circular'));
  });
});
