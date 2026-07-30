import { describe, expect, it } from 'vitest';

import { createTestNode as node } from '../createTestNode';
import type { PositionCache } from '../types';
import {
  invalidateGroupPositionCache,
  invalidateGroupPositionCacheRecursive,
  invalidatePositionCache,
} from './invalidatePositionCache';

describe('invalidatePositionCache', () => {
  it('removes cache for groups with changed fingerprint', () => {
    const cache: PositionCache = new Map([
      [null, new Map([['a', { x: 10, y: 20 }]])],
      ['a', new Map([['c', { x: 5, y: 5 }]])],
    ]);

    const previous = new Map([
      [null, 'a,b'],
      ['a', 'c'],
    ]);
    const current = new Map([
      [null, 'a,b'],
      ['a', 'c,d'],
    ]);

    invalidatePositionCache(cache, current, previous, new Set(['a', 'b', 'c']));

    expect(cache.has(null)).toBe(true);
    expect(cache.has('a')).toBe(false);
  });

  it('removes cache for groups that no longer exist', () => {
    const cache: PositionCache = new Map([
      [null, new Map([['a', { x: 0, y: 0 }]])],
      ['gone', new Map()],
    ]);

    invalidatePositionCache(cache, new Map([[null, 'a']]), null, new Set(['a']));

    expect(cache.has('gone')).toBe(false);
  });

  it('preserves cache for collapsed folder still visible as leaf', () => {
    const cache: PositionCache = new Map([
      [
        'folder-a',
        new Map([
          ['file-1', { x: 10, y: 20 }],
          ['file-2', { x: 30, y: 40 }],
        ]),
      ],
    ]);

    const collapsedFingerprints = new Map([[null, 'folder-a']]);

    invalidatePositionCache(cache, collapsedFingerprints, null, new Set(['folder-a']));

    expect(cache.has('folder-a')).toBe(true);
    expect(cache.get('folder-a')?.get('file-1')).toEqual({ x: 10, y: 20 });
  });

  it('preserves cache for nested group when ancestor is collapsed', () => {
    const cache: PositionCache = new Map([
      ['parent/folder-a', new Map([['parent/folder-a/file-1', { x: 10, y: 20 }]])],
      ['parent/folder-a/child-b', new Map([['parent/folder-a/child-b/file-2', { x: 30, y: 40 }]])],
    ]);

    const collapsedParentFingerprints = new Map([[null, 'parent/folder-a']]);

    invalidatePositionCache(cache, collapsedParentFingerprints, null, new Set(['parent/folder-a']));

    expect(cache.has('parent/folder-a')).toBe(true);
    expect(cache.has('parent/folder-a/child-b')).toBe(true);
    expect(cache.get('parent/folder-a/child-b')?.get('parent/folder-a/child-b/file-2')).toEqual({ x: 30, y: 40 });
  });
});

describe('invalidateGroupPositionCache', () => {
  it('removes only the selected group cache and parent entry', () => {
    const parentByNode = new Map<string, string | null>([
      ['parent', null],
      ['parent/child', 'parent'],
      ['parent/child/file', 'parent/child'],
    ]);
    const cache: PositionCache = new Map([
      [null, new Map([['parent', { x: 10, y: 20 }]])],
      ['parent', new Map([['parent/child', { x: 30, y: 40 }]])],
      ['parent/child', new Map([['parent/child/file', { x: 50, y: 60 }]])],
    ]);

    invalidateGroupPositionCache(cache, 'parent/child', parentByNode);

    expect(cache.get('parent/child')).toBeUndefined();
    expect(cache.get('parent')).toBeUndefined();
    expect(cache.get(null)?.get('parent')).toEqual({ x: 10, y: 20 });
  });
});

describe('invalidateGroupPositionCacheRecursive', () => {
  it('removes group cache, descendant group caches, and parent entry for the group', () => {
    const parentByNode = new Map<string, string | null>([
      ['parent', null],
      ['parent/child', 'parent'],
      ['parent/child/nested', 'parent/child'],
      ['parent/child/file', 'parent/child'],
    ]);
    const nodes = [
      node('parent', { type: 'folderGroup' }),
      node('parent/child', { type: 'folderGroup', parentId: 'parent' }),
      node('parent/child/nested', { type: 'folderGroup', parentId: 'parent/child' }),
      node('parent/child/file', { parentId: 'parent/child' }),
    ];
    const cache: PositionCache = new Map([
      [null, new Map([['parent', { x: 10, y: 20 }]])],
      ['parent', new Map([['parent/child', { x: 30, y: 40 }]])],
      ['parent/child', new Map([['parent/child/file', { x: 50, y: 60 }]])],
      ['parent/child/nested', new Map([['parent/child/nested/file', { x: 70, y: 80 }]])],
    ]);

    invalidateGroupPositionCacheRecursive(cache, 'parent/child', nodes, parentByNode);

    expect(cache.get('parent/child')).toBeUndefined();
    expect(cache.get('parent/child/nested')).toBeUndefined();
    expect(cache.get('parent')).toBeUndefined();
    expect(cache.get(null)?.get('parent')).toEqual({ x: 10, y: 20 });
  });
});
