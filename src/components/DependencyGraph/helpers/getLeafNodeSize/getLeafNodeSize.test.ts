import { describe, expect, it } from 'vitest';

import { getLeafNodeSize, LEAF_NODE_MIN_WIDTH } from './getLeafNodeSize';

describe('getLeafNodeSize', () => {
  it('uses minimum width for short file labels', () => {
    expect(getLeafNodeSize('a.ts', 'file')).toEqual({ width: LEAF_NODE_MIN_WIDTH, height: 40 });
  });

  it('uses minimum width for short folder labels', () => {
    expect(getLeafNodeSize('foo', 'folder')).toEqual({ width: LEAF_NODE_MIN_WIDTH, height: 40 });
  });

  it('grows file width for long labels', () => {
    const short = getLeafNodeSize('short.ts', 'file');
    const long = getLeafNodeSize('very-long-file-name-that-exceeds-minimum-width.ts', 'file');

    expect(long.width).toBeGreaterThan(LEAF_NODE_MIN_WIDTH);
    expect(long.width).toBeGreaterThan(short.width);
  });

  it('grows folder width for long labels', () => {
    const long = getLeafNodeSize('very-long-folder-name-that-exceeds-minimum-width', 'folder');

    expect(long.width).toBeGreaterThan(LEAF_NODE_MIN_WIDTH);
  });

  it('makes folder wider than file for the same label', () => {
    const label = 'component-name.ts';
    const file = getLeafNodeSize(label, 'file');
    const folder = getLeafNodeSize(label, 'folder');

    expect(folder.width).toBeGreaterThan(file.width);
  });

  it('increases width monotonically with label length', () => {
    const widths = ['a.ts', 'ab.ts', 'abc.ts', 'abcd.ts'].map(label => getLeafNodeSize(label, 'file').width);

    for (let i = 1; i < widths.length; i++) {
      expect(widths[i]).toBeGreaterThanOrEqual(widths[i - 1]!);
    }
  });
});
