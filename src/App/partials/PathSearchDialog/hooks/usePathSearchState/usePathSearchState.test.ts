// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { usePathSearchState } from './usePathSearchState';

describe('usePathSearchState', () => {
  it('returns fuzzy matches for the query', () => {
    const { result } = renderHook(() => usePathSearchState({ sources: ['src/foo/a.ts', 'src/bar/b.ts'] }));

    act(() => {
      result.current.setQuery('foo');
    });

    expect(result.current.results.some(item => item.key === 'src/foo/a.ts')).toBe(true);
  });

  it('restricts results to exact sources when exactSourcesOnly is set', () => {
    const { result } = renderHook(() => usePathSearchState({ sources: ['src/foo/a.ts'], exactSourcesOnly: true }));

    act(() => {
      result.current.setQuery('src');
    });

    expect(result.current.results.every(item => item.key === 'src/foo/a.ts')).toBe(true);
    expect(result.current.results.some(item => item.isFolder)).toBe(false);
  });
});
