// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook, waitFor } from '@testing-library/react';

import { buildCruiseSnapshot } from '@/domain';

import type { BuildGraphResult } from '../../types';
import { useBuildGraph } from './useBuildGraph';

const buildGraph = vi.hoisted(() => vi.fn());

vi.mock('../../helpers', async importOriginal => {
  const actual = await importOriginal<typeof import('../../helpers')>();
  return {
    ...actual,
    buildGraph,
  };
});

const FOLDER_COLORS = new Map<string, string>();

const cruiseSnapshot = buildCruiseSnapshot([
  { source: 'a.ts', dependencies: [] },
  { source: 'b.ts', dependencies: [] },
] as never[]);

const EMPTY_SELECTION = {};
const SELECTED_A = { 'a.ts': true };
const EMPTY_VISIBLE_TREE: never[] = [];

const graphResult: BuildGraphResult = {
  nodes: [{ id: 'a.ts', position: { x: 0, y: 0 }, data: {} }],
  edges: [],
  visibleNodeIds: new Set(['a.ts']),
  parentByNode: new Map(),
};

const hookInputBase = {
  cruiseSnapshot,
  folderColors: FOLDER_COLORS,
  visibleTree: EMPTY_VISIBLE_TREE,
};

describe('useBuildGraph', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('clears graph when selection is empty', async () => {
    buildGraph.mockResolvedValue(graphResult);
    const { result } = renderHook(() =>
      useBuildGraph({
        ...hookInputBase,
        selectedFilePaths: EMPTY_SELECTION,
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
        ...hookInputBase,
        selectedFilePaths: SELECTED_A,
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
        ...hookInputBase,
        selectedFilePaths: SELECTED_A,
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
        ...hookInputBase,
        selectedFilePaths: SELECTED_A,
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
        ...hookInputBase,
        selectedFilePaths: SELECTED_A,
      }),
    );

    unmount();

    await act(async () => {
      resolveBuild(graphResult);
      await Promise.resolve();
    });

    expect(buildGraph).toHaveBeenCalled();
  });
});
