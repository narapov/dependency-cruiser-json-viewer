// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useAutoFitView } from './useAutoFitView';

const fitView = vi.hoisted(() => vi.fn(() => Promise.resolve(true)));

vi.mock('@xyflow/react', () => ({
  useReactFlow: () => ({ fitView }),
}));

describe('useAutoFitView', () => {
  afterEach(() => {
    fitView.mockClear();
  });

  it('fits view on initial layout when nodes exist', () => {
    renderHook(() =>
      useAutoFitView({
        selectedFilePaths: Object.fromEntries(['a.ts'].map(p => [p, true])),
        layoutNodesLength: 2,
        hasUserLayout: false,
        autoLayoutOnly: false,
      }),
    );

    expect(fitView).toHaveBeenCalledWith({ padding: 0.2, duration: 300 });
  });

  it('does not fit when there are no layout nodes', () => {
    renderHook(() =>
      useAutoFitView({
        selectedFilePaths: Object.fromEntries(['a.ts'].map(p => [p, true])),
        layoutNodesLength: 0,
        hasUserLayout: false,
        autoLayoutOnly: false,
      }),
    );

    expect(fitView).not.toHaveBeenCalled();
  });

  it('does not fit when user has customized layout', () => {
    renderHook(() =>
      useAutoFitView({
        selectedFilePaths: Object.fromEntries(['a.ts'].map(p => [p, true])),
        layoutNodesLength: 2,
        hasUserLayout: true,
        autoLayoutOnly: false,
      }),
    );

    expect(fitView).not.toHaveBeenCalled();
  });

  it('does not fit in autoLayoutOnly mode', () => {
    renderHook(() =>
      useAutoFitView({
        selectedFilePaths: Object.fromEntries(['a.ts'].map(p => [p, true])),
        layoutNodesLength: 2,
        hasUserLayout: false,
        autoLayoutOnly: true,
      }),
    );

    expect(fitView).not.toHaveBeenCalled();
  });

  it('fits again when selection changes', () => {
    const { rerender } = renderHook(
      ({ selectedFilePaths }) =>
        useAutoFitView({
          selectedFilePaths,
          layoutNodesLength: 2,
          hasUserLayout: false,
          autoLayoutOnly: false,
        }),
      { initialProps: { selectedFilePaths: Object.fromEntries(['a.ts'].map(p => [p, true])) } },
    );

    expect(fitView).toHaveBeenCalledTimes(1);

    rerender({ selectedFilePaths: Object.fromEntries(['a.ts', 'b.ts'].map(p => [p, true])) });
    expect(fitView).toHaveBeenCalledTimes(2);

    rerender({ selectedFilePaths: Object.fromEntries(['a.ts', 'b.ts'].map(p => [p, true])) });
    expect(fitView).toHaveBeenCalledTimes(2);
  });
});
