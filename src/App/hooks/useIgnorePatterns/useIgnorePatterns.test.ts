// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

import { IGNORE_PATTERNS_STORAGE_KEY } from '../../partials/IgnorePatternsDialog';
import { useIgnorePatterns } from './useIgnorePatterns';

describe('useIgnorePatterns', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('returns empty patterns when storage is missing', () => {
    const { result } = renderHook(() => useIgnorePatterns());
    expect(result.current.patterns).toEqual([]);
  });

  it('returns empty patterns for invalid JSON', () => {
    localStorage.setItem(IGNORE_PATTERNS_STORAGE_KEY, '{not-json');
    const { result } = renderHook(() => useIgnorePatterns());
    expect(result.current.patterns).toEqual([]);
  });

  it('returns empty patterns for non-array JSON', () => {
    localStorage.setItem(IGNORE_PATTERNS_STORAGE_KEY, JSON.stringify({ a: 1 }));
    const { result } = renderHook(() => useIgnorePatterns());
    expect(result.current.patterns).toEqual([]);
  });

  it('filters non-string items from stored array', () => {
    localStorage.setItem(IGNORE_PATTERNS_STORAGE_KEY, JSON.stringify(['a', 1, null, 'b']));
    const { result } = renderHook(() => useIgnorePatterns());
    expect(result.current.patterns).toEqual(['a', 'b']);
  });

  it('persists patterns on setPatterns', () => {
    const { result } = renderHook(() => useIgnorePatterns());

    act(() => {
      result.current.setPatterns(['**/*.test.ts', '**/__tests__/**']);
    });

    expect(result.current.patterns).toEqual(['**/*.test.ts', '**/__tests__/**']);
    expect(localStorage.getItem(IGNORE_PATTERNS_STORAGE_KEY)).toBe(JSON.stringify(['**/*.test.ts', '**/__tests__/**']));
  });

  it('removes storage key when patterns are cleared', () => {
    localStorage.setItem(IGNORE_PATTERNS_STORAGE_KEY, JSON.stringify(['**/*.test.ts']));
    const { result } = renderHook(() => useIgnorePatterns());

    act(() => {
      result.current.setPatterns([]);
    });

    expect(result.current.patterns).toEqual([]);
    expect(localStorage.getItem(IGNORE_PATTERNS_STORAGE_KEY)).toBeNull();
  });
});
