// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useIgnorePatterns } from './useIgnorePatterns';

describe('useIgnorePatterns', () => {
  it('starts with empty patterns', () => {
    const { result } = renderHook(() => useIgnorePatterns());
    expect(result.current.patterns).toEqual([]);
  });

  it('updates patterns in memory without touching localStorage', () => {
    const { result } = renderHook(() => useIgnorePatterns());

    act(() => {
      result.current.setPatterns(['**/*.test.ts', '**/__tests__/**']);
    });

    expect(result.current.patterns).toEqual(['**/*.test.ts', '**/__tests__/**']);
  });

  it('clears patterns in memory', () => {
    const { result } = renderHook(() => useIgnorePatterns());

    act(() => {
      result.current.setPatterns(['**/*.test.ts']);
    });
    act(() => {
      result.current.setPatterns([]);
    });

    expect(result.current.patterns).toEqual([]);
  });
});
