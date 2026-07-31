// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';
import type { Edge } from '@xyflow/react';

import { useEdgeContextMenu } from './useEdgeContextMenu';

vi.mock('../../partials/EdgeContextMenuHeader', () => ({
  EdgeContextMenuHeader: () => null,
}));

vi.mock('../../partials/EdgeHighlightSubmenu', () => ({
  EdgeHighlightSubmenu: () => null,
}));

const edge: Edge = { id: 'a->b', source: 'a.ts', target: 'b.ts' };

describe('useEdgeContextMenu', () => {
  afterEach(() => {
    cleanup();
  });

  it('opens menu state from onEdgeContextMenu', () => {
    const { result } = renderHook(() =>
      useEdgeContextMenu({
        onFocusNode: vi.fn(),
        getEdgeHighlight: vi.fn(),
        onSetUserEdgeHighlight: vi.fn(),
      }),
    );

    expect(result.current.edgeContextMenu.props.open).toBe(false);

    const preventDefault = vi.fn();
    act(() => {
      result.current.onEdgeContextMenu({ preventDefault, clientX: 12, clientY: 34 } as never, edge);
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(result.current.edgeContextMenu.props.open).toBe(true);
    expect(result.current.edgeContextMenu.props.anchorPosition).toEqual({ top: 34, left: 12 });
  });

  it('closes menu via onClose', () => {
    const { result } = renderHook(() =>
      useEdgeContextMenu({
        onFocusNode: vi.fn(),
        getEdgeHighlight: vi.fn(),
        onSetUserEdgeHighlight: vi.fn(),
      }),
    );

    act(() => {
      result.current.onEdgeContextMenu({ preventDefault: vi.fn(), clientX: 1, clientY: 2 } as never, edge);
    });
    expect(result.current.edgeContextMenu.props.open).toBe(true);

    act(() => {
      result.current.edgeContextMenu.props.onClose();
    });
    expect(result.current.edgeContextMenu.props.open).toBe(false);
  });
});
