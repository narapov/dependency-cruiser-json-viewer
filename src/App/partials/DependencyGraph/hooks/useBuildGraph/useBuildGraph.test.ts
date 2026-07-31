// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook, waitFor } from '@testing-library/react';

import type { BuildGraphResult } from '../../types';
import { useBuildGraph } from './useBuildGraph';

const buildGraph = vi.hoisted(() => vi.fn());
const assignFolderColors = vi.hoisted(() => vi.fn(() => new Map<string, string>()));

vi.mock('../../helpers', async importOriginal => {
  const actual = await importOriginal<typeof import('../../helpers')>();
  return {
    ...actual,
    buildGraph,
    assignFolderColors,
  };
});

const modules = [
  { source: 'a.ts', dependencies: [] },
  { source: 'b.ts', dependencies: [] },
] as never[];

const EMPTY_EXPANDED: string[] = [];
const SELECTED_A = ['a.ts'];
const EXPANDED_SRC = ['src', 'src/a'];

const graphResult: BuildGraphResult = {
  nodes: [{ id: 'a.ts', position: { x: 0, y: 0 }, data: {} }],
  edges: [],
  visibleNodeIds: new Set(['a.ts']),
  parentByNode: new Map(),
};

const onToggleFolder = vi.fn();
const onExpandRecursive = vi.fn();
const onShowInFileTree = vi.fn();

describe('useBuildGraph', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('clears graph when selection is empty', async () => {
    buildGraph.mockResolvedValue(graphResult);
    const { result } = renderHook(() =>
      useBuildGraph({
        modules,
        selectedPaths: EMPTY_EXPANDED,
        expandedKeys: EMPTY_EXPANDED,
        colorMode: 'light',
        onToggleFolder,
        onExpandRecursive,
        onShowInFileTree,
      }),
    );

    await waitFor(() => {
      expect(result.current.isBuildingGraph).toBe(false);
    });

    expect(result.current.graphResult.nodes).toEqual([]);
    expect(result.current.buildFailed).toBe(false);
    expect(buildGraph).not.toHaveBeenCalled();
  });

  it('loads graph result on success', async () => {
    buildGraph.mockResolvedValue(graphResult);
    const { result } = renderHook(() =>
      useBuildGraph({
        modules,
        selectedPaths: SELECTED_A,
        expandedKeys: EMPTY_EXPANDED,
        colorMode: 'light',
        onToggleFolder,
        onExpandRecursive,
        onShowInFileTree,
      }),
    );

    expect(result.current.isBuildingGraph).toBe(true);

    await waitFor(() => {
      expect(result.current.isBuildingGraph).toBe(false);
    });

    expect(result.current.graphResult).toEqual(graphResult);
    expect(result.current.buildFailed).toBe(false);
    expect(buildGraph).toHaveBeenCalled();
  });

  it('sets buildFailed when buildGraph rejects', async () => {
    buildGraph.mockRejectedValue(new Error('layout failed'));
    const { result } = renderHook(() =>
      useBuildGraph({
        modules,
        selectedPaths: SELECTED_A,
        expandedKeys: EMPTY_EXPANDED,
        colorMode: 'light',
        onToggleFolder,
        onExpandRecursive,
        onShowInFileTree,
      }),
    );

    await waitFor(() => {
      expect(result.current.isBuildingGraph).toBe(false);
    });

    expect(result.current.buildFailed).toBe(true);
    expect(result.current.graphResult.nodes).toEqual([]);
  });

  it('clearBuildFailed resets the failure flag', async () => {
    buildGraph.mockRejectedValue(new Error('layout failed'));
    const { result } = renderHook(() =>
      useBuildGraph({
        modules,
        selectedPaths: SELECTED_A,
        expandedKeys: EMPTY_EXPANDED,
        colorMode: 'light',
        onToggleFolder,
        onExpandRecursive,
        onShowInFileTree,
      }),
    );

    await waitFor(() => {
      expect(result.current.buildFailed).toBe(true);
    });

    act(() => {
      result.current.clearBuildFailed();
    });

    expect(result.current.buildFailed).toBe(false);
  });

  it('ignores stale results after unmount', async () => {
    let resolveBuild: (value: BuildGraphResult) => void = () => {};
    buildGraph.mockImplementation(
      () =>
        new Promise<BuildGraphResult>(resolve => {
          resolveBuild = resolve;
        }),
    );

    const { unmount } = renderHook(() =>
      useBuildGraph({
        modules,
        selectedPaths: SELECTED_A,
        expandedKeys: EMPTY_EXPANDED,
        colorMode: 'light',
        onToggleFolder,
        onExpandRecursive,
        onShowInFileTree,
      }),
    );

    unmount();

    await act(async () => {
      resolveBuild(graphResult);
      await Promise.resolve();
    });

    expect(buildGraph).toHaveBeenCalled();
  });

  it('exposes expandedFolders as a Set', () => {
    buildGraph.mockResolvedValue(graphResult);
    const { result } = renderHook(() =>
      useBuildGraph({
        modules,
        selectedPaths: EMPTY_EXPANDED,
        expandedKeys: EXPANDED_SRC,
        colorMode: 'light',
        onToggleFolder,
        onExpandRecursive,
        onShowInFileTree,
      }),
    );

    expect(result.current.expandedFolders).toEqual(new Set(['src', 'src/a']));
  });
});
