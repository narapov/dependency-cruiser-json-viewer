// @vitest-environment jsdom
import { createElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

import { CruiseResultParseError } from '@/domain';

import { useInitialWorkspaceSettingsFromCli } from './useInitialWorkspaceSettingsFromCli';

const fetchWorkspaceSettingsFile = vi.hoisted(() => vi.fn());

vi.mock('../../api/workspaceSettings', () => ({
  fetchWorkspaceSettingsFile,
}));

const settings = {
  ignorePatterns: ['**/*.test.ts'],
  selectedFiles: ['a.ts'],
  expandedKeys: [],
  dependenciesPath: null,
  applicableRulesPath: null,
  userEdgeHighlights: {},
  folderColors: {},
  autoLayoutOnly: true,
  edgeStyle: 'bezier',
  nodePositions: {},
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  return { queryClient, wrapper };
}

function getT() {
  const {
    result: {
      current: { t },
    },
  } = renderHook(() => useTranslation());
  return t;
}

describe('useInitialWorkspaceSettingsFromCli', () => {
  afterEach(() => {
    delete window.envs;
    vi.clearAllMocks();
  });

  it('does not fetch when initialWorkspaceSettings is not enabled', async () => {
    window.envs = { watch: false };
    const onLoaded = vi.fn();
    const { wrapper } = createWrapper();
    renderHook(() => useInitialWorkspaceSettingsFromCli({ cruiseReady: true, onLoaded }), { wrapper });

    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchWorkspaceSettingsFile).not.toHaveBeenCalled();
    expect(onLoaded).not.toHaveBeenCalled();
  });

  it('does not fetch when cruise is not ready', async () => {
    window.envs = { initialWorkspaceSettings: true };
    const onLoaded = vi.fn();
    const { wrapper } = createWrapper();
    renderHook(() => useInitialWorkspaceSettingsFromCli({ cruiseReady: false, onLoaded }), { wrapper });

    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchWorkspaceSettingsFile).not.toHaveBeenCalled();
    expect(onLoaded).not.toHaveBeenCalled();
  });

  it('fetches and applies settings once when enabled and cruise is ready', async () => {
    window.envs = { initialWorkspaceSettings: true };
    fetchWorkspaceSettingsFile.mockResolvedValue({
      cruiseResult: { modules: [], summary: {} },
      settings,
    });
    const onLoaded = vi.fn();
    const { wrapper } = createWrapper();
    const { rerender } = renderHook(
      ({ cruiseReady }) => useInitialWorkspaceSettingsFromCli({ cruiseReady, onLoaded }),
      { wrapper, initialProps: { cruiseReady: true } },
    );

    await waitFor(() => {
      expect(onLoaded).toHaveBeenCalledWith(settings);
    });
    expect(fetchWorkspaceSettingsFile).toHaveBeenCalledTimes(1);

    rerender({ cruiseReady: true });
    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchWorkspaceSettingsFile).toHaveBeenCalledTimes(1);
    expect(onLoaded).toHaveBeenCalledTimes(1);
  });

  it('errors when the file has no workspace settings', async () => {
    window.envs = { initialWorkspaceSettings: true };
    fetchWorkspaceSettingsFile.mockResolvedValue({
      cruiseResult: { modules: [], summary: {} },
    });
    const t = getT();
    const onLoaded = vi.fn();
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useInitialWorkspaceSettingsFromCli({ cruiseReady: true, onLoaded }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.fileLoadError).toBe(t('app.missingWorkspaceSettings'));
    });
    expect(onLoaded).not.toHaveBeenCalled();
  });

  it('sets invalidJson error message for CruiseResultParseError', async () => {
    window.envs = { initialWorkspaceSettings: true };
    fetchWorkspaceSettingsFile.mockRejectedValue(new CruiseResultParseError('invalidJson'));
    const t = getT();
    const onLoaded = vi.fn();
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useInitialWorkspaceSettingsFromCli({ cruiseReady: true, onLoaded }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.fileLoadError).toBe(t('app.invalidCruiseResultJson'));
    });
    expect(onLoaded).not.toHaveBeenCalled();
  });
});
