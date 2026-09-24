// @vitest-environment jsdom

import type { IModule } from 'dependency-cruiser';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { buildCruiseTreeSnapshot } from '@/domain';

import { CruiseTreeProvider } from '../../../../contexts';
import { usePathSearchState } from './usePathSearchState';

function cruiseTreeOf(sources: readonly string[]) {
  return buildCruiseTreeSnapshot(
    sources.map(source => ({ source, dependencies: [], dependents: [], valid: true }) as IModule),
  );
}

function wrapperFor(snapshot: ReturnType<typeof cruiseTreeOf>) {
  return function Wrapper(props: { children: ReactNode }) {
    return <CruiseTreeProvider value={snapshot}>{props.children}</CruiseTreeProvider>;
  };
}

describe('usePathSearchState', () => {
  it('returns fuzzy matches for the query', () => {
    const snapshot = cruiseTreeOf(['src/foo/a.ts', 'src/bar/b.ts']);
    const { result } = renderHook(() => usePathSearchState(), { wrapper: wrapperFor(snapshot) });

    act(() => {
      result.current.setQuery('foo');
    });

    expect(result.current.results.some(item => item.key === 'src/foo/a.ts')).toBe(true);
  });

  it('restricts results to allowedPaths when set', () => {
    const snapshot = cruiseTreeOf(['src/foo/a.ts', 'src/bar/b.ts']);
    const { result } = renderHook(() => usePathSearchState({ allowedPaths: ['src/foo/a.ts'] }), {
      wrapper: wrapperFor(snapshot),
    });

    act(() => {
      result.current.setQuery('src');
    });

    expect(result.current.results.every(item => item.key === 'src/foo/a.ts')).toBe(true);
    expect(result.current.results.some(item => item.isFolder)).toBe(false);
  });
});
