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

const FOLDER_COLORS = new Map<string, string>();

const cruiseSnapshot = buildCruiseSnapshot([
  { source: 'a.ts', dependencies: [] },
  { source: 'b.ts', dependencies: [] },
] as never[]);

const EMPTY_SELECTION = {};
const SELECTED_A = { 'a.ts': true };
const SELECTED_B = { 'b.ts': true };
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

    await waitFor(() => {
      expect(result.current.isBuildingGraph).toBe(false);
    });

    expect(result.current.graphResult.nodes).toEqual([]);
    expect(result.current.buildFailed).toBe(false);
    expect(runBuildGraphInWorker).not.toHaveBeenCalled();
  });

  it('loads graph result on success', async () => {
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

    expect(result.current.isBuildingGraph).toBe(true);

    await waitFor(() => {
      expect(result.current.isBuildingGraph).toBe(false);
    });

    expect(result.current.graphResult).toEqual(graphResult);
    expect(result.current.buildFailed).toBe(false);
    expect(runBuildGraphInWorker).toHaveBeenCalled();
  });

  it('sets buildFailed when worker session rejects', async () => {
    let rejectLatestBuild: (error: Error) => void = () => {};
    runBuildGraphInWorker.mockImplementation(() => ({
      promise: new Promise<BuildGraphResult>((_, reject) => {
        rejectLatestBuild = reject;
      }),
      terminate: vi.fn(),
    }));

    const { result } = renderHook(() =>
      useBuildGraph({
        ...hookInputBase,
        selectedFilePaths: SELECTED_A,
      }),
    );

    await act(async () => {
      rejectLatestBuild(new Error('layout failed'));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.isBuildingGraph).toBe(false);
    });

    expect(result.current.buildFailed).toBe(true);
    expect(result.current.graphResult.nodes).toEqual([]);
  });

  it('clearBuildFailed resets the failure flag', async () => {
    let rejectLatestBuild: (error: Error) => void = () => {};
    runBuildGraphInWorker.mockImplementation(() => ({
      promise: new Promise<BuildGraphResult>((_, reject) => {
        rejectLatestBuild = reject;
      }),
      terminate: vi.fn(),
    }));

    const { result } = renderHook(() =>
      useBuildGraph({
        ...hookInputBase,
        selectedFilePaths: SELECTED_A,
      }),
    );

    await act(async () => {
      rejectLatestBuild(new Error('layout failed'));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.buildFailed).toBe(true);
    });

    act(() => {
      result.current.clearBuildFailed();
    });

    expect(result.current.buildFailed).toBe(false);
  });

  it('ignores stale results after unmount', async () => {
    let resolveLatestBuild: (value: BuildGraphResult) => void = () => {};
    runBuildGraphInWorker.mockImplementation(() => ({
      promise: new Promise<BuildGraphResult>(resolve => {
        resolveLatestBuild = resolve;
      }),
      terminate: vi.fn(),
    }));

    const { unmount } = renderHook(() =>
      useBuildGraph({
        ...hookInputBase,
        selectedFilePaths: SELECTED_A,
      }),
    );

    unmount();

    await act(async () => {
      resolveLatestBuild(graphResult);
      await Promise.resolve();
    });

    expect(runBuildGraphInWorker).toHaveBeenCalled();
  });

  it('terminates the previous worker session when inputs change', async () => {
    const terminate = vi.fn();
    runBuildGraphInWorker.mockImplementation(() => ({
      promise: new Promise<BuildGraphResult>(() => {}),
      terminate,
    }));

    const { rerender } = renderHook(
      (props: { selectedFilePaths: Record<string, boolean | undefined> }) =>
        useBuildGraph({
          ...hookInputBase,
          selectedFilePaths: props.selectedFilePaths,
        }),
      { initialProps: { selectedFilePaths: SELECTED_A as Record<string, boolean | undefined> } },
    );

    const terminateCallsBeforeRerender = terminate.mock.calls.length;

    rerender({ selectedFilePaths: SELECTED_B });

    expect(terminate.mock.calls.length).toBeGreaterThan(terminateCallsBeforeRerender);
  });
});
