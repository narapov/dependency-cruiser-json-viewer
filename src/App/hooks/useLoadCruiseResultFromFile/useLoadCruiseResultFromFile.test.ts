// @vitest-environment jsdom
import { createElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';

import { CruiseResultParseError } from '@/domain';

import { useLoadCruiseResultFromFile } from './useLoadCruiseResultFromFile';

const parseCruiseResultJson = vi.hoisted(() => vi.fn());

vi.mock('@/domain', async importOriginal => {
  const actual = await importOriginal<typeof import('@/domain')>();
  return {
    ...actual,
    parseCruiseResultJson,
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
    parseCruiseResultJson.mockReturnValue(cruiseResult);
    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useLoadCruiseResultFromFile(), { wrapper });

    const file = new File(['{"modules":[]}'], 'cruise.json', { type: 'application/json' });

    await act(async () => {
      await result.current.handleFileSelect(file);
    });

    expect(parseCruiseResultJson).toHaveBeenCalled();
    expect(queryClient.getQueryData(['cruise-result'])).toEqual(cruiseResult);
    expect(result.current.fileLoadError).toBeNull();
  });

  it('sets invalidJson error message for CruiseResultParseError', async () => {
    parseCruiseResultJson.mockImplementation(() => {
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
    parseCruiseResultJson.mockImplementation(() => {
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
    parseCruiseResultJson.mockImplementation(() => {
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
    parseCruiseResultJson.mockImplementation(() => {
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
    parseCruiseResultJson.mockImplementation(() => {
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
});
