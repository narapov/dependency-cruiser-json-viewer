// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { STORAGE_KEY, useAppPanelsLayout } from './useAppPanelsLayout';

describe('useAppPanelsLayout', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('queueMicrotask', (callback: () => void) => {
      callback();
    });
  });

  it('persists user-driven layouts under a per-combination key', () => {
    const { result } = renderHook(() => useAppPanelsLayout(['sidebar', 'graph']));

    act(() => {
      result.current.onLayoutChanged({ sidebar: 25, graph: 75 }, { isUserInteraction: true });
    });

    expect(localStorage.getItem(`${STORAGE_KEY}:sidebar:graph`)).toBe(JSON.stringify({ sidebar: 25, graph: 75 }));
  });

  it('does not persist non-user layout changes when the panel set is unchanged', () => {
    const { result } = renderHook(() => useAppPanelsLayout(['sidebar', 'graph']));

    act(() => {
      result.current.onLayoutChanged({ sidebar: 25, graph: 75 }, { isUserInteraction: false });
    });

    expect(localStorage.getItem(`${STORAGE_KEY}:sidebar:graph`)).toBeNull();
  });

  it('preserves sidebar size and saves when the panel set shrinks', () => {
    const { result, rerender } = renderHook(({ panelIds }: { panelIds: string[] }) => useAppPanelsLayout(panelIds), {
      initialProps: { panelIds: ['sidebar', 'graph', 'dependencies'] },
    });

    const setLayout = vi.fn();
    Object.defineProperty(result.current.groupRef, 'current', {
      configurable: true,
      value: { getLayout: vi.fn(), setLayout },
    });

    act(() => {
      result.current.onLayoutChanged({ sidebar: 15, graph: 50, dependencies: 35 }, { isUserInteraction: true });
    });

    rerender({ panelIds: ['sidebar', 'graph'] });

    act(() => {
      result.current.onLayoutChanged({ sidebar: 20, graph: 80 }, { isUserInteraction: false });
    });

    expect(setLayout).toHaveBeenCalledWith({ sidebar: 15, graph: 85 });
    expect(localStorage.getItem(`${STORAGE_KEY}:sidebar:graph`)).toBe(JSON.stringify({ sidebar: 15, graph: 85 }));
  });
});
