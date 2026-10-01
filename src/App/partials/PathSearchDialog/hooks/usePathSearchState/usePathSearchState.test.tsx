// @vitest-environment jsdom

import type { IModule } from 'dependency-cruiser';
import { beforeEach, describe, expect, it } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { buildCruiseSnapshot } from '@/domain';

import { initialWorkspaceState, useWorkspaceStore } from '../../../../stores/workspaceStore';
import { usePathSearchState } from './usePathSearchState';

function seedSources(sources: readonly string[]) {
  useWorkspaceStore.setState({
    ...initialWorkspaceState,
    cruiseSnapshot: buildCruiseSnapshot(
      sources.map(source => ({ source, dependencies: [], dependents: [], valid: true }) as IModule),
    ),
  });
}

describe('usePathSearchState', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ ...initialWorkspaceState });
  });

  it('returns fuzzy matches for the query', () => {
    seedSources(['src/foo/a.ts', 'src/bar/b.ts']);
    const { result } = renderHook(() => usePathSearchState());

    act(() => {
      result.current.setQuery('foo');
    });

    expect(result.current.results.some(item => item.key === 'src/foo/a.ts')).toBe(true);
  });

  it('restricts results to allowedPaths when set', () => {
    seedSources(['src/foo/a.ts', 'src/bar/b.ts']);
    const { result } = renderHook(() => usePathSearchState({ allowedPaths: ['src/foo/a.ts'] }));

    act(() => {
      result.current.setQuery('src');
    });

    expect(result.current.results.every(item => item.key === 'src/foo/a.ts')).toBe(true);
    expect(result.current.results.some(item => item.isFolder)).toBe(false);
  });
});
