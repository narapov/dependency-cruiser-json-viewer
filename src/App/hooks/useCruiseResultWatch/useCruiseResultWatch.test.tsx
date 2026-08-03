// @vitest-environment jsdom
import type { ICruiseResult, ISummary } from 'dependency-cruiser';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

import { CRUISE_RESULT_CHANGED_EVENT } from '@/Shared';

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
  });

  it('does not connect when watch is disabled', () => {
    window.envs = { watch: false };
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(
      () =>
        useCruiseResultWatch({
          cruiseLoadId: 0,
          setCruiseLoadId: vi.fn(),
          setPatterns: vi.fn(),
          getCurrentWorkspaceSettings: vi.fn(() => null),
          applyWorkspaceView: vi.fn(),
        }),
      { wrapper },
    );

    expect(socketOn).not.toHaveBeenCalled();
  });

  it('refetches and applies current workspace settings on change event', async () => {
    window.envs = { watch: true };
    const queryClient = new QueryClient();
    queryClient.setQueryDefaults(['cruise-result'], {
      queryFn: async () => cruiseResult,
    });
    const fetchQuery = vi.spyOn(queryClient, 'fetchQuery').mockResolvedValue(cruiseResult);

    const setCruiseLoadId = vi.fn();
    const setPatterns = vi.fn();
    const applyWorkspaceView = vi.fn();
    const getCurrentWorkspaceSettings = vi.fn(() => ({
      ignorePatterns: ['**/*.test.ts'],
      selectedFiles: ['src/a.ts'],
      expandedKeys: ['src'],
      dependenciesPath: null,
      userEdgeHighlights: {},
      folderColors: {},
      autoLayoutOnly: true,
      nodePositions: {},
    }));

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(
      () =>
        useCruiseResultWatch({
          cruiseLoadId: 2,
          setCruiseLoadId,
          setPatterns,
          getCurrentWorkspaceSettings,
          applyWorkspaceView,
        }),
      { wrapper },
    );

    expect(socketOn).toHaveBeenCalledWith(CRUISE_RESULT_CHANGED_EVENT, expect.any(Function));
    expect(changedHandler).toBeTypeOf('function');

    await act(async () => {
      changedHandler?.();
    });

    await waitFor(() => {
      expect(fetchQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['cruise-result'],
          staleTime: 0,
        }),
      );
      expect(setCruiseLoadId).toHaveBeenCalledWith(3);
      expect(setPatterns).toHaveBeenCalledWith(['**/*.test.ts']);
      expect(applyWorkspaceView).toHaveBeenCalledWith(
        expect.objectContaining({
          cruiseLoadId: 3,
          sourcesKey: 'src/a.ts',
        }),
      );
    });
  });
});
