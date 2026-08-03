// @vitest-environment jsdom
import { createElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';

import { CruiseResultParseError } from '@/domain';

import { useLoadWorkspaceSettingsFromFile } from './useLoadWorkspaceSettingsFromFile';

const parseViewerFileJson = vi.hoisted(() => vi.fn());

vi.mock('@/domain', async importOriginal => {
  const actual = await importOriginal<typeof import('@/domain')>();
  return {
    ...actual,
    parseViewerFileJson,
  };
});

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

const settings = {
  ignorePatterns: ['**/*.test.ts'],
  selectedFiles: ['a.ts'],
  expandedKeys: [],
  dependenciesPath: null,
  userEdgeHighlights: {},
  folderColors: {},
  autoLayoutOnly: true,
  nodePositions: {},
};

describe('useLoadWorkspaceSettingsFromFile', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('applies settings without replacing the cruise cache', async () => {
    const existingCruise = { modules: [{ source: 'a.ts' }], summary: {} };
    const fileCruise = { modules: [{ source: 'b.ts' }], summary: {} };
    parseViewerFileJson.mockReturnValue({ cruiseResult: fileCruise, settings });

    const onLoaded = vi.fn();
    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(['cruise-result'], existingCruise);
    const { result } = renderHook(() => useLoadWorkspaceSettingsFromFile({ onLoaded }), { wrapper });

    await act(async () => {
      await result.current.handleFileSelect(new File(['{}'], 'workspace.json'));
    });

    expect(onLoaded).toHaveBeenCalledWith(settings);
    expect(queryClient.getQueryData(['cruise-result'])).toEqual(existingCruise);
    expect(result.current.fileLoadError).toBeNull();
  });

  it('errors when no cruise result is loaded', async () => {
    parseViewerFileJson.mockReturnValue({
      cruiseResult: { modules: [], summary: {} },
      settings,
    });
    const t = getT();
    const onLoaded = vi.fn();
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLoadWorkspaceSettingsFromFile({ onLoaded }), { wrapper });

    await act(async () => {
      await result.current.handleFileSelect(new File(['{}'], 'workspace.json'));
    });

    expect(onLoaded).not.toHaveBeenCalled();
    expect(result.current.fileLoadError).toBe(t('app.loadWorkspaceSettingsRequiresCruise'));
  });

  it('errors when the file has no workspace settings', async () => {
    parseViewerFileJson.mockReturnValue({ cruiseResult: { modules: [], summary: {} } });
    const t = getT();
    const onLoaded = vi.fn();
    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(['cruise-result'], { modules: [], summary: {} });
    const { result } = renderHook(() => useLoadWorkspaceSettingsFromFile({ onLoaded }), { wrapper });

    await act(async () => {
      await result.current.handleFileSelect(new File(['{}'], 'cruise.json'));
    });

    expect(onLoaded).not.toHaveBeenCalled();
    expect(result.current.fileLoadError).toBe(t('app.missingWorkspaceSettings'));
  });

  it('sets invalidJson error message for CruiseResultParseError', async () => {
    parseViewerFileJson.mockImplementation(() => {
      throw new CruiseResultParseError('invalidJson');
    });
    const t = getT();
    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(['cruise-result'], { modules: [], summary: {} });
    const { result } = renderHook(() => useLoadWorkspaceSettingsFromFile(), { wrapper });

    await act(async () => {
      await result.current.handleFileSelect(new File(['bad'], 'workspace.json'));
    });

    expect(result.current.fileLoadError).toBe(t('app.invalidCruiseResultJson'));
  });

  it('openFilePicker clears error and opens the file input', async () => {
    parseViewerFileJson.mockImplementation(() => {
      throw new CruiseResultParseError('invalidJson');
    });
    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(['cruise-result'], { modules: [], summary: {} });
    const { result } = renderHook(() => useLoadWorkspaceSettingsFromFile(), { wrapper });

    await act(async () => {
      await result.current.handleFileSelect(new File(['bad'], 'workspace.json'));
    });

    const open = vi.fn();
    result.current.fileInputRef.current = { open };

    act(() => {
      result.current.openFilePicker();
    });

    expect(result.current.fileLoadError).toBeNull();
    expect(open).toHaveBeenCalled();
  });
});
