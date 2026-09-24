// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useHighlightEdgeDialogState } from './useHighlightEdgeDialogState';

describe('useHighlightEdgeDialogState', () => {
  it('starts on the source step', () => {
    const { result } = renderHook(() => useHighlightEdgeDialogState());

    expect(result.current.step).toBe('source');
    expect(result.current.sourcePath).toBeNull();
    expect(result.current.targetPath).toBeNull();
  });

  it('advances source → target → color', () => {
    const { result } = renderHook(() => useHighlightEdgeDialogState());

    act(() => {
      result.current.selectSource('src/a.ts');
    });
    expect(result.current.step).toBe('target');
    expect(result.current.sourcePath).toBe('src/a.ts');

    act(() => {
      result.current.selectTarget('src/b.ts');
    });
    expect(result.current.step).toBe('color');
    expect(result.current.targetPath).toBe('src/b.ts');
  });
});
