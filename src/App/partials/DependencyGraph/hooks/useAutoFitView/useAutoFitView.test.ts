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
        selectedPaths: ['a.ts'],
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
        selectedPaths: ['a.ts'],
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
        selectedPaths: ['a.ts'],
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
        selectedPaths: ['a.ts'],
        layoutNodesLength: 2,
        hasUserLayout: false,
        autoLayoutOnly: true,
      }),
    );

    expect(fitView).not.toHaveBeenCalled();
  });

  it('fits again when selection changes', () => {
    const { rerender } = renderHook(
      ({ selectedPaths }) =>
        useAutoFitView({
          selectedPaths,
          layoutNodesLength: 2,
          hasUserLayout: false,
          autoLayoutOnly: false,
        }),
      { initialProps: { selectedPaths: ['a.ts'] } },
    );

    expect(fitView).toHaveBeenCalledTimes(1);

    rerender({ selectedPaths: ['a.ts', 'b.ts'] });
    expect(fitView).toHaveBeenCalledTimes(2);

    rerender({ selectedPaths: ['a.ts', 'b.ts'] });
    expect(fitView).toHaveBeenCalledTimes(2);
  });
});
