// @vitest-environment jsdom
import type { ICruiseResult, ISummary } from 'dependency-cruiser';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

import { getCruiseSources } from '@/domain';
import { CRUISE_RESULT_CHANGED_EVENT } from '@/Shared';

import { fetchCruiseResult } from '../../api/cruiseResult';
import { initialWorkspaceState, useWorkspaceStore } from '../../stores/workspaceStore';
import { useCruiseResultWatch } from './useCruiseResultWatch';

const socketOn = vi.fn();
const socketOff = vi.fn();
const socketDisconnect = vi.fn();
let changedHandler: (() => void) | undefined;

vi.mock('socket.io-client', () => ({
  io: () => ({
    on: (event: string, handler: () => void) => {
      socketOn(event, handler);
      if (event === CRUISE_RESULT_CHANGED_EVENT) {
        changedHandler = handler;
      }
    },
    off: socketOff,
    disconnect: socketDisconnect,
  }),
}));

vi.mock('../../api/cruiseResult', () => ({
  fetchCruiseResult: vi.fn(),
}));

const cruiseResult = {
  modules: [
    {
      source: 'src/a.ts',
      dependencies: [],
      dependents: [],
      valid: true,
    },
  ],
  summary: {
    totalCruised: 1,
    violations: [],
    error: 0,
    warn: 0,
    info: 0,
    ignore: 0,
    advisedExitCode: 0,
    optionsUsed: { args: '' },
    environment: {} as ISummary['environment'],
  },
} as ICruiseResult;

describe('useCruiseResultWatch', () => {
  beforeEach(() => {
    socketOn.mockClear();
    socketOff.mockClear();
    socketDisconnect.mockClear();
    changedHandler = undefined;
    delete window.envs;
    useWorkspaceStore.setState({ ...initialWorkspaceState, userEdgeHighlights: new Map() });
    vi.mocked(fetchCruiseResult).mockReset();
    vi.mocked(fetchCruiseResult).mockResolvedValue(cruiseResult);
  });

  it('does not connect when watch is disabled', () => {
    window.envs = { watch: false };
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(() => useCruiseResultWatch(), { wrapper });

    expect(socketOn).not.toHaveBeenCalled();
  });

  it('refetches and soft-resets the workspace on change event', async () => {
    window.envs = { watch: true };
    const queryClient = new QueryClient();
    const setQueryData = vi.spyOn(queryClient, 'setQueryData');
    useWorkspaceStore.getState().reset(
      {
        ...cruiseResult,
        modules: [
          ...cruiseResult.modules,
          {
            source: 'src/b.ts',
            dependencies: [],
            dependents: [],
            valid: true,
          },
        ],
      } as ICruiseResult,
      'hard',
    );
    useWorkspaceStore.getState().setActivePath('src/a.ts');

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(() => useCruiseResultWatch(), { wrapper });

    expect(socketOn).toHaveBeenCalledWith(CRUISE_RESULT_CHANGED_EVENT, expect.any(Function));
    expect(changedHandler).toBeTypeOf('function');

    await act(async () => {
      changedHandler?.();
    });

    await waitFor(() => {
      expect(fetchCruiseResult).toHaveBeenCalledWith(undefined, { cacheBust: true });
      expect(setQueryData).toHaveBeenCalledWith(['cruise-result'], cruiseResult);
      expect(getCruiseSources(useWorkspaceStore.getState().cruiseSnapshot).sort()).toEqual(['src/a.ts'].sort());
      expect(useWorkspaceStore.getState().activePath).toBe('src/a.ts');
    });
  });
});
