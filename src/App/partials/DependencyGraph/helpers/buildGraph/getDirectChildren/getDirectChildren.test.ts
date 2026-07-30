import { describe, expect, it } from 'vitest';

import { getDirectChildren } from './getDirectChildren';

describe('getDirectChildren', () => {
  it('returns only nodes whose parent matches folderId', () => {
    const parentByNode = new Map<string, string | null>([
      ['folder', null],
      ['a', 'folder'],
      ['b', 'folder'],
      ['c', 'a'],
    ]);
    const visibleNodeIds = new Set(['folder', 'a', 'b', 'c']);

    expect(getDirectChildren('folder', visibleNodeIds, parentByNode)).toEqual(['a', 'b']);
  });

  it('supports null root parent', () => {
    const parentByNode = new Map<string, string | null>([
      ['a', null],
      ['b', null],
      ['c', 'a'],
    ]);
    const visibleNodeIds = new Set(['a', 'b', 'c']);

    expect(getDirectChildren(null, visibleNodeIds, parentByNode)).toEqual(['a', 'b']);
  });

  it('returns sorted ids', () => {
    const parentByNode = new Map<string, string | null>([
      ['z', null],
      ['a', null],
      ['m', null],
    ]);
    const visibleNodeIds = new Set(['z', 'a', 'm']);

    expect(getDirectChildren(null, visibleNodeIds, parentByNode)).toEqual(['a', 'm', 'z']);
  });

  it('ignores nodes not in visibleNodeIds', () => {
    const parentByNode = new Map<string, string | null>([
      ['a', null],
      ['b', null],
      ['hidden', null],
    ]);
    const visibleNodeIds = new Set(['a', 'b']);

    expect(getDirectChildren(null, visibleNodeIds, parentByNode)).toEqual(['a', 'b']);
  });
});
