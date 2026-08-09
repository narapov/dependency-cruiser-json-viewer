// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { act, fireEvent, renderHook } from '@testing-library/react';

import { useCruiseResultFileDrop } from './useCruiseResultFileDrop';

function createFileDragEventInit(
  files: File[] = [],
  options: { types?: string[]; itemTypes?: string[] } = {},
): DragEventInit {
  const types = options.types ?? ['Files'];
  const itemTypes = options.itemTypes ?? files.map(file => file.type);
  const fileList = {
    length: files.length,
    item: (index: number) => files[index] ?? null,
    *[Symbol.iterator]() {
      yield* files;
    },
  } as unknown as FileList;

  files.forEach((file, index) => {
    Object.defineProperty(fileList, index, { value: file, enumerable: true });
  });

  const items = itemTypes.map(type => ({
    kind: 'file' as const,
    type,
    getAsFile: () => null,
    getAsString: vi.fn(),
    webkitGetAsEntry: vi.fn(),
  }));

  const itemList = {
    length: items.length,
    item: (index: number) => items[index] ?? null,
    *[Symbol.iterator]() {
      yield* items;
    },
  } as unknown as DataTransferItemList;

  items.forEach((item, index) => {
    Object.defineProperty(itemList, index, { value: item, enumerable: true });
  });

  return {
    dataTransfer: {
      types,
      files: fileList,
      items: itemList,
      dropEffect: 'none',
      effectAllowed: 'all',
      setData: vi.fn(),
      getData: vi.fn(),
      clearData: vi.fn(),
      setDragImage: vi.fn(),
    } as DataTransfer,
  };
}

describe('useCruiseResultFileDrop', () => {
  it('sets isDraggingFile on file dragenter and clears on matching dragleave', () => {
    const { result } = renderHook(() =>
      useCruiseResultFileDrop({ enabled: true, onFile: vi.fn(), onInvalidFile: vi.fn() }),
    );

    expect(result.current.isDraggingFile).toBe(false);

    act(() => {
      fireEvent.dragEnter(window, createFileDragEventInit());
    });
    expect(result.current.isDraggingFile).toBe(true);

    act(() => {
      fireEvent.dragLeave(window, createFileDragEventInit());
    });
    expect(result.current.isDraggingFile).toBe(false);
  });

  it('keeps overlay active across nested enter/leave until depth returns to zero', () => {
    const { result } = renderHook(() =>
      useCruiseResultFileDrop({ enabled: true, onFile: vi.fn(), onInvalidFile: vi.fn() }),
    );

    act(() => {
      fireEvent.dragEnter(window, createFileDragEventInit());
      fireEvent.dragEnter(window, createFileDragEventInit());
      fireEvent.dragLeave(window, createFileDragEventInit());
    });
    expect(result.current.isDraggingFile).toBe(true);

    act(() => {
      fireEvent.dragLeave(window, createFileDragEventInit());
    });
    expect(result.current.isDraggingFile).toBe(false);
  });

  it('marks drop as allowed for application/json and sets copy dropEffect', () => {
    const { result } = renderHook(() => useCruiseResultFileDrop({ enabled: true, onFile: vi.fn() }));
    const eventInit = createFileDragEventInit([], { itemTypes: ['application/json'] });

    act(() => {
      fireEvent.dragEnter(window, eventInit);
      fireEvent.dragOver(window, eventInit);
    });

    expect(result.current.isDropAllowed).toBe(true);
    expect(eventInit.dataTransfer?.dropEffect).toBe('copy');
  });

  it('marks drop as disallowed for non-JSON MIME and sets none dropEffect', () => {
    const { result } = renderHook(() => useCruiseResultFileDrop({ enabled: true, onFile: vi.fn() }));
    const eventInit = createFileDragEventInit([], { itemTypes: ['text/plain'] });

    act(() => {
      fireEvent.dragEnter(window, eventInit);
      fireEvent.dragOver(window, eventInit);
    });

    expect(result.current.isDraggingFile).toBe(true);
    expect(result.current.isDropAllowed).toBe(false);
    expect(eventInit.dataTransfer?.dropEffect).toBe('none');
  });

  it('calls onFile with the first JSON file on drop', () => {
    const onFile = vi.fn();
    const onInvalidFile = vi.fn();
    const file = new File(['{}'], 'cruise.json', { type: 'application/json' });
    renderHook(() => useCruiseResultFileDrop({ enabled: true, onFile, onInvalidFile }));

    act(() => {
      fireEvent.drop(window, createFileDragEventInit([file]));
    });

    expect(onFile).toHaveBeenCalledWith(file);
    expect(onInvalidFile).not.toHaveBeenCalled();
  });

  it('calls onInvalidFile when dropped files are not JSON', () => {
    const onFile = vi.fn();
    const onInvalidFile = vi.fn();
    const file = new File(['x'], 'notes.txt', { type: 'text/plain' });
    renderHook(() => useCruiseResultFileDrop({ enabled: true, onFile, onInvalidFile }));

    act(() => {
      fireEvent.drop(window, createFileDragEventInit([file]));
    });

    expect(onFile).not.toHaveBeenCalled();
    expect(onInvalidFile).toHaveBeenCalledTimes(1);
  });

  it('ignores non-Files drag events', () => {
    const onFile = vi.fn();
    const { result } = renderHook(() => useCruiseResultFileDrop({ enabled: true, onFile, onInvalidFile: vi.fn() }));

    act(() => {
      fireEvent.dragEnter(window, createFileDragEventInit([], { types: ['text/plain'] }));
      fireEvent.drop(window, createFileDragEventInit([], { types: ['text/plain'] }));
    });

    expect(result.current.isDraggingFile).toBe(false);
    expect(onFile).not.toHaveBeenCalled();
  });

  it('does not attach listeners when disabled', () => {
    const onFile = vi.fn();
    const { result } = renderHook(() => useCruiseResultFileDrop({ enabled: false, onFile, onInvalidFile: vi.fn() }));

    act(() => {
      fireEvent.dragEnter(window, createFileDragEventInit());
      fireEvent.drop(window, createFileDragEventInit([new File(['{}'], 'cruise.json')]));
    });

    expect(result.current.isDraggingFile).toBe(false);
    expect(onFile).not.toHaveBeenCalled();
  });

  it('clears dragging state when enabled becomes false', () => {
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useCruiseResultFileDrop({ enabled, onFile: vi.fn() }),
      { initialProps: { enabled: true } },
    );

    act(() => {
      fireEvent.dragEnter(window, createFileDragEventInit());
    });
    expect(result.current.isDraggingFile).toBe(true);

    rerender({ enabled: false });
    expect(result.current.isDraggingFile).toBe(false);
  });
});
