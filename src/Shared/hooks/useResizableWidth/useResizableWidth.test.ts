// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, fireEvent, renderHook } from '@testing-library/react';

import { MIN_MAIN_WIDTH, useResizableWidth } from './useResizableWidth';

const mocks = vi.hoisted(() => ({
  windowWidth: 1000 as number,
}));

vi.mock('react-use', async importOriginal => {
  const actual = await importOriginal<typeof import('react-use')>();
  return {
    ...actual,
    useWindowSize: () => ({ width: mocks.windowWidth, height: 800 }),
  };
});

function createHandle() {
  const handle = document.createElement('div');
  const captured = new Set<number>();
  handle.setPointerCapture = (pointerId: number) => {
    captured.add(pointerId);
  };
  handle.hasPointerCapture = (pointerId: number) => captured.has(pointerId);
  handle.releasePointerCapture = (pointerId: number) => {
    captured.delete(pointerId);
  };
  document.body.appendChild(handle);
  return handle;
}

function pointerDown(
  onResizePointerDown: ReturnType<typeof useResizableWidth>['onResizePointerDown'],
  handle: HTMLDivElement,
  { clientX, pointerId = 1 }: { clientX: number; pointerId?: number },
) {
  const event = {
    preventDefault: vi.fn(),
    currentTarget: handle,
    pointerId,
    clientX,
  } as unknown as React.PointerEvent<HTMLDivElement>;
  act(() => {
    onResizePointerDown(event);
  });
  return event;
}

describe('useResizableWidth', () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.windowWidth = 1000;
    document.body.className = '';
  });

  afterEach(() => {
    document.body.replaceChildren();
    document.body.className = '';
    vi.restoreAllMocks();
  });

  it('returns defaultWidth when storage is empty', () => {
    const { result } = renderHook(() =>
      useResizableWidth({
        storageKey: 'test-width',
        defaultWidth: 280,
        minWidth: 200,
        side: 'left',
      }),
    );

    expect(result.current.width).toBe(280);
  });

  it('reads persisted width from localStorage', () => {
    localStorage.setItem('test-width', JSON.stringify(320));

    const { result } = renderHook(() =>
      useResizableWidth({
        storageKey: 'test-width',
        defaultWidth: 280,
        minWidth: 200,
        side: 'left',
      }),
    );

    expect(result.current.width).toBe(320);
  });

  it('clamps stored width when window shrinks', () => {
    localStorage.setItem('test-width', JSON.stringify(700));
    mocks.windowWidth = 500;

    const { result } = renderHook(() =>
      useResizableWidth({
        storageKey: 'test-width',
        defaultWidth: 280,
        minWidth: 200,
        side: 'left',
        oppositeWidth: 0,
      }),
    );

    expect(result.current.width).toBe(500 - MIN_MAIN_WIDTH);
  });

  it('accounts for oppositeWidth when computing max width', () => {
    localStorage.setItem('test-width', JSON.stringify(700));
    mocks.windowWidth = 800;

    const { result } = renderHook(() =>
      useResizableWidth({
        storageKey: 'test-width',
        defaultWidth: 280,
        minWidth: 200,
        side: 'left',
        oppositeWidth: 300,
      }),
    );

    expect(result.current.width).toBe(800 - 300 - MIN_MAIN_WIDTH);
  });

  it('increases left-side width on drag right and adds resizingSidebar class', () => {
    const handle = createHandle();
    const { result } = renderHook(() =>
      useResizableWidth({
        storageKey: 'test-width',
        defaultWidth: 280,
        minWidth: 200,
        side: 'left',
      }),
    );

    pointerDown(result.current.onResizePointerDown, handle, { clientX: 100 });
    expect(document.body.classList.contains('resizingSidebar')).toBe(true);

    act(() => {
      fireEvent.pointerMove(document, { clientX: 150, pointerId: 1 });
    });

    expect(result.current.width).toBe(330);

    act(() => {
      fireEvent.pointerUp(document, { pointerId: 1 });
    });

    expect(document.body.classList.contains('resizingSidebar')).toBe(false);
    expect(localStorage.getItem('test-width')).toBe('330');
  });

  it('decreases right-side width when dragging right and uses resizingPanel class', () => {
    const handle = createHandle();
    const { result } = renderHook(() =>
      useResizableWidth({
        storageKey: 'test-width',
        defaultWidth: 300,
        minWidth: 200,
        side: 'right',
      }),
    );

    pointerDown(result.current.onResizePointerDown, handle, { clientX: 700 });
    expect(document.body.classList.contains('resizingPanel')).toBe(true);

    act(() => {
      fireEvent.pointerMove(document, { clientX: 750, pointerId: 1 });
    });

    expect(result.current.width).toBe(250);

    act(() => {
      fireEvent.pointerUp(document, { pointerId: 1 });
    });

    expect(document.body.classList.contains('resizingPanel')).toBe(false);
  });

  it('ignores pointermove from a different pointerId', () => {
    const handle = createHandle();
    const { result } = renderHook(() =>
      useResizableWidth({
        storageKey: 'test-width',
        defaultWidth: 280,
        minWidth: 200,
        side: 'left',
      }),
    );

    pointerDown(result.current.onResizePointerDown, handle, { clientX: 100, pointerId: 1 });

    act(() => {
      fireEvent.pointerMove(document, { clientX: 200, pointerId: 2 });
    });

    expect(result.current.width).toBe(280);
  });

  it('clamps drag width to minWidth', () => {
    const handle = createHandle();
    const { result } = renderHook(() =>
      useResizableWidth({
        storageKey: 'test-width',
        defaultWidth: 280,
        minWidth: 200,
        side: 'left',
      }),
    );

    pointerDown(result.current.onResizePointerDown, handle, { clientX: 100 });

    act(() => {
      fireEvent.pointerMove(document, { clientX: -500, pointerId: 1 });
    });

    expect(result.current.width).toBe(200);
  });

  it('prevents default on context menu', () => {
    const { result } = renderHook(() =>
      useResizableWidth({
        storageKey: 'test-width',
        defaultWidth: 280,
        minWidth: 200,
        side: 'left',
      }),
    );

    const event = { preventDefault: vi.fn() } as unknown as React.MouseEvent<HTMLDivElement>;
    act(() => {
      result.current.onResizeContextMenu(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('removes document listeners and resizing class on unmount mid-drag', () => {
    const handle = createHandle();
    const removeEventListener = vi.spyOn(document, 'removeEventListener');
    const { result, unmount } = renderHook(() =>
      useResizableWidth({
        storageKey: 'test-width',
        defaultWidth: 280,
        minWidth: 200,
        side: 'left',
      }),
    );

    pointerDown(result.current.onResizePointerDown, handle, { clientX: 100 });
    expect(document.body.classList.contains('resizingSidebar')).toBe(true);
    expect(handle.hasPointerCapture(1)).toBe(true);

    unmount();

    expect(document.body.classList.contains('resizingSidebar')).toBe(false);
    expect(handle.hasPointerCapture(1)).toBe(false);
    expect(removeEventListener).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(removeEventListener).toHaveBeenCalledWith('pointerup', expect.any(Function));
    expect(removeEventListener).toHaveBeenCalledWith('pointercancel', expect.any(Function));
  });
});
