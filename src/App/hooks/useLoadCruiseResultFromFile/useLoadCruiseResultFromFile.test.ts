// @vitest-environment jsdom
import { createElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';

import { CruiseResultParseError } from '@/domain';

import { useLoadCruiseResultFromFile } from './useLoadCruiseResultFromFile';

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

describe('useLoadCruiseResultFromFile', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('stores parsed cruise result in the query cache on success', async () => {
    const cruiseResult = { modules: [], summary: {} };
    parseViewerFileJson.mockReturnValue({ cruiseResult });
    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useLoadCruiseResultFromFile(), { wrapper });

    const file = new File(['{"modules":[]}'], 'cruise.json', { type: 'application/json' });

    await act(async () => {
      await result.current.handleFileSelect(file);
    });

    expect(parseViewerFileJson).toHaveBeenCalled();
    expect(queryClient.getQueryData(['cruise-result'])).toEqual(cruiseResult);
    expect(result.current.fileLoadError).toBeNull();
  });

  it('sets invalidJson error message for CruiseResultParseError', async () => {
    parseViewerFileJson.mockImplementation(() => {
      throw new CruiseResultParseError('invalidJson');
    });
    const t = getT();
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLoadCruiseResultFromFile(), { wrapper });

    await act(async () => {
      await result.current.handleFileSelect(new File(['bad'], 'cruise.json'));
    });

    expect(result.current.fileLoadError).toBe(t('app.invalidCruiseResultJson'));
  });

  it('sets invalidFormat error message for format parse errors', async () => {
    parseViewerFileJson.mockImplementation(() => {
      throw new CruiseResultParseError('invalidFormat');
    });
    const t = getT();
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLoadCruiseResultFromFile(), { wrapper });

    await act(async () => {
      await result.current.handleFileSelect(new File(['{}'], 'cruise.json'));
    });

    expect(result.current.fileLoadError).toBe(t('app.invalidCruiseResultFormat'));
  });

  it('sets format error for unexpected failures', async () => {
    parseViewerFileJson.mockImplementation(() => {
      throw new Error('boom');
    });
    const t = getT();
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLoadCruiseResultFromFile(), { wrapper });

    await act(async () => {
      await result.current.handleFileSelect(new File(['{}'], 'cruise.json'));
    });

    expect(result.current.fileLoadError).toBe(t('app.invalidCruiseResultFormat'));
  });

  it('clears file load error', async () => {
    parseViewerFileJson.mockImplementation(() => {
      throw new CruiseResultParseError('invalidJson');
    });
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLoadCruiseResultFromFile(), { wrapper });

    await act(async () => {
      await result.current.handleFileSelect(new File(['bad'], 'cruise.json'));
    });
    expect(result.current.fileLoadError).not.toBeNull();

    act(() => {
      result.current.clearFileLoadError();
    });

    expect(result.current.fileLoadError).toBeNull();
  });

  it('openFilePicker clears error and opens the file input', async () => {
    parseViewerFileJson.mockImplementation(() => {
      throw new CruiseResultParseError('invalidJson');
    });
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLoadCruiseResultFromFile(), { wrapper });

    await act(async () => {
      await result.current.handleFileSelect(new File(['bad'], 'cruise.json'));
    });

    const open = vi.fn();
    result.current.fileInputRef.current = { open };

    act(() => {
      result.current.openFilePicker();
    });

    expect(result.current.fileLoadError).toBeNull();
    expect(open).toHaveBeenCalled();
  });

  it('replaces the cruise cache and reports optional settings', async () => {
    const cruiseResult = { modules: [], summary: {} };
    parseViewerFileJson.mockReturnValue({ cruiseResult });
    const onLoaded = vi.fn();
    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useLoadCruiseResultFromFile({ onLoaded }), { wrapper });

    await act(async () => {
      await result.current.handleFileSelect(new File(['{"modules":[]}'], 'cruise.json'));
    });

    expect(onLoaded).toHaveBeenCalledWith({ cruiseResult, settings: undefined });
    expect(queryClient.getQueryData(['cruise-result'])).toEqual(cruiseResult);
  });

  it('sets query data before onLoaded', async () => {
    const cruiseResult = { modules: [{ source: 'a.ts' }], summary: {} };
    parseViewerFileJson.mockReturnValue({ cruiseResult });
    const { queryClient, wrapper } = createWrapper();
    const seenDuringOnLoaded: unknown[] = [];
    const onLoaded = vi.fn(() => {
      seenDuringOnLoaded.push(queryClient.getQueryData(['cruise-result']));
    });
    const { result } = renderHook(() => useLoadCruiseResultFromFile({ onLoaded }), { wrapper });

    await act(async () => {
      await result.current.handleFileSelect(new File(['{}'], 'cruise.json'));
    });

    expect(seenDuringOnLoaded).toEqual([cruiseResult]);
  });

  it('warns when cruise loads but workspace settings were ignored', async () => {
    const cruiseResult = { modules: [], summary: {} };
    parseViewerFileJson.mockReturnValue({ cruiseResult, workspaceSettingsIgnored: true });
    const t = getT();
    const onLoaded = vi.fn();
    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useLoadCruiseResultFromFile({ onLoaded }), { wrapper });

    await act(async () => {
      await result.current.handleFileSelect(new File(['{}'], 'cruise.json'));
    });

    expect(onLoaded).toHaveBeenCalledWith({ cruiseResult, settings: undefined });
    expect(queryClient.getQueryData(['cruise-result'])).toEqual(cruiseResult);
    expect(result.current.fileLoadError).toBe(t('app.ignoredInvalidWorkspaceSettings'));
  });

  it('ignores a stale load when a newer file is selected', async () => {
    const resultA = { modules: [{ source: 'a.ts' }], summary: {} };
    const resultB = { modules: [{ source: 'b.ts' }], summary: {} };
    parseViewerFileJson.mockImplementation((text: string) => {
      if (text === 'A') {
        return { cruiseResult: resultA };
      }
      if (text === 'B') {
        return { cruiseResult: resultB };
      }
      throw new CruiseResultParseError('invalidFormat');
    });

    let resolveA!: (value: string) => void;
    const deferredA = new Promise<string>(resolve => {
      resolveA = resolve;
    });

    const textSpy = vi.spyOn(File.prototype, 'text').mockImplementation(function (this: File) {
      if (this.name === 'a.json') {
        return deferredA;
      }
      return Promise.resolve('B');
    });

    try {
      const { queryClient, wrapper } = createWrapper();
      const { result } = renderHook(() => useLoadCruiseResultFromFile(), { wrapper });

      const fileA = new File(['A'], 'a.json', { type: 'application/json' });
      const fileB = new File(['B'], 'b.json', { type: 'application/json' });

      let loadA: Promise<void> = Promise.resolve();
      await act(async () => {
        loadA = result.current.handleFileSelect(fileA);
        await result.current.handleFileSelect(fileB);
      });

      expect(queryClient.getQueryData(['cruise-result'])).toEqual(resultB);
      expect(result.current.fileLoadError).toBeNull();

      await act(async () => {
        resolveA('A');
        await loadA;
      });

      expect(queryClient.getQueryData(['cruise-result'])).toEqual(resultB);
      expect(result.current.fileLoadError).toBeNull();
    } finally {
      textSpy.mockRestore();
    }
  });

  it('aborts an in-flight load on unmount', async () => {
    const cruiseResult = { modules: [{ source: 'a.ts' }], summary: {} };
    parseViewerFileJson.mockReturnValue({ cruiseResult });

    const { promise: deferredText, resolve: resolveText } = Promise.withResolvers<string>();
    const textSpy = vi.spyOn(File.prototype, 'text').mockReturnValue(deferredText);

    try {
      const { queryClient, wrapper } = createWrapper();
      const { result, unmount } = renderHook(() => useLoadCruiseResultFromFile(), { wrapper });

      let load: Promise<void> = Promise.resolve();
      await act(async () => {
        load = result.current.handleFileSelect(new File(['A'], 'a.json'));
      });

      unmount();

      await act(async () => {
        resolveText('A');
        await load;
      });

      expect(queryClient.getQueryData(['cruise-result'])).toBeUndefined();
    } finally {
      textSpy.mockRestore();
    }
  });
});
