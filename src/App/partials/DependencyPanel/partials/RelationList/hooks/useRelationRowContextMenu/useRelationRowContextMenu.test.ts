// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useRelationRowContextMenu } from './useRelationRowContextMenu';

vi.mock('@/Shared', async importOriginal => {
  const actual = await importOriginal<typeof import('@/Shared')>();
  return {
    ...actual,
    copyToClipboard: vi.fn(() => Promise.resolve()),
  };
});

describe('useRelationRowContextMenu', () => {
  it('opens menu from onContextMenu', () => {
    const { result } = renderHook(() =>
      useRelationRowContextMenu({
        path: 'src/a.ts',
        onShowInGraph: vi.fn(),
      }),
    );

    expect(result.current.contextMenu.props.open).toBe(false);

    const preventDefault = vi.fn();
    act(() => {
      result.current.onContextMenu({
        preventDefault,
        clientX: 40,
        clientY: 50,
      } as never);
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(result.current.contextMenu.props.open).toBe(true);
    expect(result.current.contextMenu.props.anchorPosition).toEqual({ top: 50, left: 40 });
  });

  it('closes menu via onClose', () => {
    const { result } = renderHook(() =>
      useRelationRowContextMenu({
        path: 'src/a.ts',
        onShowInGraph: vi.fn(),
      }),
    );

    act(() => {
      result.current.onContextMenu({
        preventDefault: vi.fn(),
        clientX: 1,
        clientY: 2,
      } as never);
    });
    expect(result.current.contextMenu.props.open).toBe(true);

    act(() => {
      result.current.contextMenu.props.onClose();
    });
    expect(result.current.contextMenu.props.open).toBe(false);
  });
});
