import { describe, expect, it } from 'vitest';

import { isCruiseResultDragAllowed, pickCruiseResultDropFile } from './pickCruiseResultDropFile';

describe('pickCruiseResultDropFile', () => {
  it('returns null for an empty list', () => {
    expect(pickCruiseResultDropFile([])).toBeNull();
  });

  it('returns null when more than one file is dropped', () => {
    const other = new File(['x'], 'notes.txt', { type: 'text/plain' });
    const json = new File(['{}'], 'cruise.JSON', { type: '' });

    expect(pickCruiseResultDropFile([other, json])).toBeNull();
  });

  it('returns null for a .json file without application/json MIME type', () => {
    const json = new File(['{}'], 'cruise.JSON', { type: '' });

    expect(pickCruiseResultDropFile([json])).toBeNull();
  });

  it('returns a file with application/json MIME type', () => {
    const file = new File(['{}'], 'cruise-result', { type: 'application/json' });

    expect(pickCruiseResultDropFile([file])).toBe(file);
  });

  it('returns null when the sole file is not JSON', () => {
    const file = new File(['x'], 'notes.txt', { type: 'text/plain' });

    expect(pickCruiseResultDropFile([file])).toBeNull();
  });
});

describe('isCruiseResultDragAllowed', () => {
  function createDataTransfer(itemTypes: string[]): DataTransfer {
    const items = itemTypes.map(type => ({
      kind: 'file' as const,
      type,
      getAsFile: () => null,
      getAsString: () => undefined,
      webkitGetAsEntry: () => null,
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

    return { items: itemList } as DataTransfer;
  }

  it('rejects when there are no file items', () => {
    expect(isCruiseResultDragAllowed(createDataTransfer([]))).toBe(false);
  });

  it('allows a single application/json MIME type', () => {
    expect(isCruiseResultDragAllowed(createDataTransfer(['application/json']))).toBe(true);
  });

  it('rejects a single empty MIME type', () => {
    expect(isCruiseResultDragAllowed(createDataTransfer(['']))).toBe(false);
  });

  it('rejects a single non-JSON MIME type', () => {
    expect(isCruiseResultDragAllowed(createDataTransfer(['text/plain']))).toBe(false);
  });

  it('rejects when more than one file item is dragged', () => {
    expect(isCruiseResultDragAllowed(createDataTransfer(['application/json', 'text/plain']))).toBe(false);
    expect(isCruiseResultDragAllowed(createDataTransfer(['application/json', 'application/json']))).toBe(false);
  });
});
