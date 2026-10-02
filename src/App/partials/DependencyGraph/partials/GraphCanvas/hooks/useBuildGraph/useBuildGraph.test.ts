// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook, waitFor } from '@testing-library/react';

import { buildCruiseSnapshot } from '@/domain';

import type { BuildGraphResult } from '../../types';
import { useBuildGraph } from './useBuildGraph';

const runBuildGraphInWorker = vi.hoisted(() => vi.fn());

vi.mock('../../helpers/buildGraph', () => ({
  runBuildGraphInWorker,
}));

const cruiseSnapshot = buildCruiseSnapshot([
  { source: 'a.ts', dependencies: [] },
  { source: 'b.ts', dependencies: [] },
] as never[]);

const EMPTY_SELECTION = {};
const SELECTED_A: Record<string, boolean | undefined> = { 'a.ts': true };
const SELECTED_B: Record<string, boolean | undefined> = { 'b.ts': true };
const EMPTY_VISIBLE_TREE: never[] = [];

const layoutedA = {
  path: 'a.ts',
  ancestors: [] as string[],
  descendants: [] as string[],
  valueCircular: false,
  typeOnlyCircular: false,
  position: { x: 0, y: 0 },
  width: 120,
  height: 32,
};

const graphResult: BuildGraphResult = {
  nodes: new Map([['a.ts', layoutedA]]),
  tree: new Map([['a.ts', layoutedA]]),
  edges: [],
  visibleGroupLayouts: {},
  edgesPorts: new Map(),
};

const hookInputBase = {
  cruiseSnapshot,
  visibleTree: EMPTY_VISIBLE_TREE,
};

describe('useBuildGraph', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('clears graph when selection is empty', async () => {
    runBuildGraphInWorker.mockReturnValue({
      promise: Promise.resolve(graphResult),
      terminate: vi.fn(),
    });

    const { result } = renderHook(() =>
      useBuildGraph({
        ...hookInputBase,
        selectedFilePaths: EMPTY_SELECTION,
      }),
    );

    expect(result.current.graphResult.nodes.size).toBe(0);
    expect(result.current.graphResult.tree.size).toBe(0);
    expect(result.current.isBuildingGraph).toBe(false);
    expect(runBuildGraphInWorker).not.toHaveBeenCalled();
  });

  it('loads graph result from the worker', async () => {
    runBuildGraphInWorker.mockReturnValue({
      promise: Promise.resolve(graphResult),
      terminate: vi.fn(),
    });

    const { result } = renderHook(() =>
      useBuildGraph({
        ...hookInputBase,
        selectedFilePaths: SELECTED_A,
      }),
    );

    await waitFor(() => {
      expect(result.current.isBuildingGraph).toBe(false);
    });

    expect(result.current.graphResult).toEqual(graphResult);
    expect(result.current.buildFailed).toBe(false);
  });

  it('sets buildFailed when the worker rejects', async () => {
    runBuildGraphInWorker.mockReturnValue({
      promise: Promise.reject(new Error('boom')),
      terminate: vi.fn(),
    });

    const { result } = renderHook(() =>
      useBuildGraph({
        ...hookInputBase,
        selectedFilePaths: SELECTED_A,
      }),
    );

    await waitFor(() => {
      expect(result.current.isBuildingGraph).toBe(false);
    });

    expect(result.current.graphResult.nodes.size).toBe(0);
    expect(result.current.buildFailed).toBe(true);
  });

  it('clears buildFailed via clearBuildFailed', async () => {
    runBuildGraphInWorker.mockReturnValue({
      promise: Promise.reject(new Error('boom')),
      terminate: vi.fn(),
    });

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

  it('ignores stale worker results after a newer build starts', async () => {
    let resolveLatestBuild: (value: BuildGraphResult) => void = () => {};
    runBuildGraphInWorker
      .mockReturnValueOnce({
        promise: new Promise<BuildGraphResult>(resolve => {
          resolveLatestBuild = resolve;
        }),
        terminate: vi.fn(),
      })
      .mockReturnValueOnce({
        promise: Promise.resolve(graphResult),
        terminate: vi.fn(),
      });

    const { result, rerender } = renderHook(
      ({ selectedFilePaths }) =>
        useBuildGraph({
          ...hookInputBase,
          selectedFilePaths,
        }),
      { initialProps: { selectedFilePaths: SELECTED_A } },
    );

    rerender({ selectedFilePaths: SELECTED_B });

    await waitFor(() => {
      expect(result.current.graphResult).toEqual(graphResult);
    });

    resolveLatestBuild({
      nodes: new Map([
        [
          'stale.ts',
          {
            path: 'stale.ts',
            ancestors: [],
            descendants: [],
            valueCircular: false,
            typeOnlyCircular: false,
            position: { x: 0, y: 0 },
            width: 120,
            height: 32,
          },
        ],
      ]),
      tree: new Map([
        [
          'stale.ts',
          {
            path: 'stale.ts',
            ancestors: [],
            descendants: [],
            valueCircular: false,
            typeOnlyCircular: false,
            position: { x: 0, y: 0 },
            width: 120,
            height: 32,
          },
        ],
      ]),
      edges: [],
      visibleGroupLayouts: {},
      edgesPorts: new Map(),
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.graphResult).toEqual(graphResult);
  });

  it('terminates the worker on unmount', async () => {
    const terminate = vi.fn();
    runBuildGraphInWorker.mockReturnValue({
      promise: new Promise<BuildGraphResult>(() => {}),
      terminate,
    });

    const { unmount } = renderHook(() =>
      useBuildGraph({
        ...hookInputBase,
        selectedFilePaths: SELECTED_A,
      }),
    );

    unmount();
    expect(terminate).toHaveBeenCalled();
  });
});
