import { describe, expect, it } from 'vitest';

import { buildGroupFingerprints } from '../buildGroupFingerprints';
import { createTestNode as node } from '../createTestNode';
import { invalidatePositionCache } from '../invalidatePositionCache';
import type { PositionCache } from '../types';
import {
  applyAutoLayoutGroupLevel,
  applyAutoLayoutSubtree,
  applyPositionCache,
  preserveExpandedGroupPositions,
  updateGroupCacheFromNodes,
  updateGroupPositionCache,
  updateSubtreeGroupCaches,
} from './applyPositionCache';

describe('applyPositionCache', () => {
  it('applies cached positions when fingerprint is unchanged', () => {
    const nodes = [node('a', { position: { x: 100, y: 100 } }), node('b', { position: { x: 200, y: 200 } })];
    const parentByNode = new Map<string, string | null>([
      ['a', null],
      ['b', null],
    ]);
    const cache: PositionCache = new Map([
      [
        null,
        new Map([
          ['a', { x: 10, y: 20 }],
          ['b', { x: 30, y: 40 }],
        ]),
      ],
    ]);
    const fingerprints = buildGroupFingerprints(new Set(['a', 'b']), parentByNode);

    const result = applyPositionCache(nodes, parentByNode, cache, fingerprints, fingerprints);

    expect(result.find(n => n.id === 'a')?.position).toEqual({ x: 10, y: 20 });
    expect(result.find(n => n.id === 'b')?.position).toEqual({ x: 30, y: 40 });
  });

  it('restores positions after collapse and re-expand', () => {
    const parentByNode = new Map<string, string | null>([
      ['folder-a', null],
      ['file-1', 'folder-a'],
      ['file-2', 'folder-a'],
    ]);
    const expandedNodeIds = new Set(['folder-a', 'file-1', 'file-2']);
    const expandedFingerprints = buildGroupFingerprints(expandedNodeIds, parentByNode);

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
    invalidatePositionCache(cache, collapsedFingerprints, expandedFingerprints, new Set(['folder-a']));

    const freshLayoutNodes = [
      node('folder-a', { type: 'folderGroup', position: { x: 0, y: 0 } }),
      node('file-1', { parentId: 'folder-a', position: { x: 100, y: 100 } }),
      node('file-2', { parentId: 'folder-a', position: { x: 200, y: 200 } }),
    ];

    const result = applyPositionCache(
      freshLayoutNodes,
      parentByNode,
      cache,
      expandedFingerprints,
      collapsedFingerprints,
    );

    expect(result.find(n => n.id === 'file-1')?.position).toEqual({ x: 10, y: 20 });
    expect(result.find(n => n.id === 'file-2')?.position).toEqual({ x: 30, y: 40 });
  });

  it('restores nested group positions after ancestor collapse and re-expand', () => {
    const parentByNode = new Map<string, string | null>([
      ['parent/folder-a', null],
      ['parent/folder-a/child-b', 'parent/folder-a'],
      ['parent/folder-a/child-b/file-2', 'parent/folder-a/child-b'],
    ]);
    const expandedNodeIds = new Set(['parent/folder-a', 'parent/folder-a/child-b', 'parent/folder-a/child-b/file-2']);
    const expandedFingerprints = buildGroupFingerprints(expandedNodeIds, parentByNode);

    const cache: PositionCache = new Map([
      ['parent/folder-a/child-b', new Map([['parent/folder-a/child-b/file-2', { x: 30, y: 40 }]])],
    ]);

    const collapsedParentFingerprints = new Map([[null, 'parent/folder-a']]);
    invalidatePositionCache(cache, collapsedParentFingerprints, expandedFingerprints, new Set(['parent/folder-a']));

    const freshLayoutNodes = [
      node('parent/folder-a', { type: 'folderGroup', position: { x: 0, y: 0 } }),
      node('parent/folder-a/child-b', { type: 'folderGroup', parentId: 'parent/folder-a', position: { x: 0, y: 0 } }),
      node('parent/folder-a/child-b/file-2', {
        parentId: 'parent/folder-a/child-b',
        position: { x: 200, y: 200 },
      }),
    ];

    const result = applyPositionCache(
      freshLayoutNodes,
      parentByNode,
      cache,
      expandedFingerprints,
      collapsedParentFingerprints,
    );

    expect(result.find(n => n.id === 'parent/folder-a/child-b/file-2')?.position).toEqual({ x: 30, y: 40 });
  });

  it('does not apply when fingerprint changed vs previous', () => {
    const nodes = [node('a', { position: { x: 100, y: 100 } }), node('b', { position: { x: 200, y: 200 } })];
    const parentByNode = new Map<string, string | null>([
      ['a', null],
      ['b', null],
    ]);
    const cache: PositionCache = new Map([
      [
        null,
        new Map([
          ['a', { x: 10, y: 20 }],
          ['b', { x: 30, y: 40 }],
        ]),
      ],
    ]);
    const previous = new Map([[null, 'a']]);
    const current = new Map([[null, 'a,b']]);

    const result = applyPositionCache(nodes, parentByNode, cache, current, previous);

    expect(result.find(n => n.id === 'a')?.position).toEqual({ x: 100, y: 100 });
    expect(result.find(n => n.id === 'b')?.position).toEqual({ x: 200, y: 200 });
  });

  it('applies cached children when group cache is partial', () => {
    const nodes = [node('a', { position: { x: 100, y: 100 } }), node('b', { position: { x: 200, y: 200 } })];
    const parentByNode = new Map<string, string | null>([
      ['a', null],
      ['b', null],
    ]);
    const cache: PositionCache = new Map([[null, new Map([['a', { x: 10, y: 20 }]])]]);
    const fingerprints = buildGroupFingerprints(new Set(['a', 'b']), parentByNode);

    const result = applyPositionCache(nodes, parentByNode, cache, fingerprints, fingerprints);

    expect(result.find(n => n.id === 'a')?.position).toEqual({ x: 10, y: 20 });
    expect(result.find(n => n.id === 'b')?.position).toEqual({ x: 200, y: 200 });
  });
});

describe('applyAutoLayoutGroupLevel', () => {
  it('reapplies buildGraph positions for direct children only', () => {
    const parentByNode = new Map<string, string | null>([
      ['parent', null],
      ['parent/child', 'parent'],
      ['parent/child/file', 'parent/child'],
      ['parent/file', 'parent'],
    ]);
    const currentNodes = [
      node('parent', { type: 'folderGroup', position: { x: 100, y: 100 }, width: 400, height: 300 }),
      node('parent/child', {
        type: 'folderGroup',
        parentId: 'parent',
        position: { x: 200, y: 200 },
        width: 200,
        height: 150,
      }),
      node('parent/child/file', { parentId: 'parent/child', position: { x: 250, y: 250 }, width: 120, height: 32 }),
      node('parent/file', { parentId: 'parent', position: { x: 300, y: 200 }, width: 120, height: 32 }),
    ];
    const layoutNodes = [
      node('parent', { type: 'folderGroup', position: { x: 16, y: 52 }, width: 300, height: 200 }),
      node('parent/child', {
        type: 'folderGroup',
        parentId: 'parent',
        position: { x: 16, y: 52 },
        width: 180,
        height: 120,
      }),
      node('parent/child/file', { parentId: 'parent/child', position: { x: 16, y: 52 }, width: 120, height: 32 }),
      node('parent/file', { parentId: 'parent', position: { x: 220, y: 52 }, width: 120, height: 32 }),
    ];

    const result = applyAutoLayoutGroupLevel(currentNodes, layoutNodes, 'parent', parentByNode);

    expect(result.find(n => n.id === 'parent')?.position).toEqual({ x: 16, y: 52 });
    expect(result.find(n => n.id === 'parent/child')?.position).toEqual({ x: 16, y: 52 });
    expect(result.find(n => n.id === 'parent/file')?.position).toEqual({ x: 220, y: 52 });
    expect(result.find(n => n.id === 'parent/child/file')?.position).toEqual({ x: 250, y: 250 });
  });
});

describe('applyAutoLayoutSubtree', () => {
  it('reapplies buildGraph positions for the selected group subtree only', () => {
    const parentByNode = new Map<string, string | null>([
      ['folder-a', null],
      ['folder-b', null],
      ['file-a', 'folder-a'],
    ]);
    const currentNodes = [
      node('folder-a', { type: 'folderGroup', position: { x: 100, y: 100 }, width: 300, height: 200 }),
      node('file-a', { parentId: 'folder-a', position: { x: 200, y: 200 }, width: 120, height: 32 }),
      node('folder-b', { type: 'folder', position: { x: 400, y: 100 }, width: 120, height: 32 }),
    ];
    const layoutNodes = [
      node('folder-a', { type: 'folderGroup', position: { x: 16, y: 52 }, width: 180, height: 120 }),
      node('file-a', { parentId: 'folder-a', position: { x: 16, y: 52 }, width: 120, height: 32 }),
      node('folder-b', { type: 'folder', position: { x: 220, y: 52 }, width: 120, height: 32 }),
    ];

    const result = applyAutoLayoutSubtree(currentNodes, layoutNodes, 'folder-a', parentByNode);

    expect(result.find(n => n.id === 'folder-a')?.position).toEqual({ x: 16, y: 52 });
    expect(result.find(n => n.id === 'file-a')?.position).toEqual({ x: 16, y: 52 });
    expect(result.find(n => n.id === 'folder-b')?.position).toEqual({ x: 400, y: 100 });
  });
});

describe('preserveExpandedGroupPositions', () => {
  it('keeps collapsed folder position when expanding', () => {
    const previousNodes = [
      node('folder-a', { type: 'folder', position: { x: 100, y: 50 } }),
      node('folder-b', { type: 'folder', position: { x: 300, y: 50 } }),
    ];
    const layoutNodes = [
      node('folder-a', { type: 'folderGroup', position: { x: 0, y: 0 }, width: 250, height: 200 }),
      node('file-1', { parentId: 'folder-a', position: { x: 16, y: 52 } }),
      node('folder-b', { type: 'folder', position: { x: 0, y: 0 } }),
    ];

    const result = preserveExpandedGroupPositions(layoutNodes, previousNodes);

    expect(result.find(n => n.id === 'folder-a')?.position).toEqual({ x: 100, y: 50 });
    expect(result.find(n => n.id === 'folder-b')?.position).toEqual({ x: 0, y: 0 });
  });
});

describe('updateGroupCacheFromNodes', () => {
  it('writes positions for all direct children of the group', () => {
    const cache: PositionCache = new Map();
    const nodes = [
      node('group', { type: 'folderGroup' }),
      node('a', { parentId: 'group', position: { x: 10, y: 20 } }),
      node('b', { parentId: 'group', position: { x: 30, y: 40 } }),
      node('c', { parentId: 'other', position: { x: 99, y: 99 } }),
    ];
    const parentByNode = new Map<string, string | null>([
      ['group', null],
      ['a', 'group'],
      ['b', 'group'],
      ['c', 'other'],
    ]);

    updateGroupCacheFromNodes(cache, nodes, parentByNode, 'group');

    expect(cache.get('group')).toEqual(
      new Map([
        ['a', { x: 10, y: 20 }],
        ['b', { x: 30, y: 40 }],
      ]),
    );
  });

  it('creates a new group cache map when missing', () => {
    const cache: PositionCache = new Map();
    const nodes = [node('a', { position: { x: 1, y: 2 } })];
    const parentByNode = new Map<string, string | null>([['a', null]]);

    updateGroupCacheFromNodes(cache, nodes, parentByNode, null);

    expect(cache.has(null)).toBe(true);
    expect(cache.get(null)?.get('a')).toEqual({ x: 1, y: 2 });
  });

  it('overwrites previous cached positions for the same children', () => {
    const cache: PositionCache = new Map([['group', new Map([['a', { x: 0, y: 0 }]])]]);
    const nodes = [node('group', { type: 'folderGroup' }), node('a', { parentId: 'group', position: { x: 5, y: 6 } })];
    const parentByNode = new Map<string, string | null>([
      ['group', null],
      ['a', 'group'],
    ]);

    updateGroupCacheFromNodes(cache, nodes, parentByNode, 'group');

    expect(cache.get('group')?.get('a')).toEqual({ x: 5, y: 6 });
  });
});

describe('updateGroupPositionCache', () => {
  it('updates the group and its parent group caches', () => {
    const cache: PositionCache = new Map();
    const nodes = [
      node('parent', { type: 'folderGroup' }),
      node('group', { type: 'folderGroup', parentId: 'parent', position: { x: 15, y: 25 } }),
      node('a', { parentId: 'group', position: { x: 1, y: 2 } }),
    ];
    const parentByNode = new Map<string, string | null>([
      ['parent', null],
      ['group', 'parent'],
      ['a', 'group'],
    ]);

    updateGroupPositionCache(cache, nodes, parentByNode, 'group');

    expect(cache.get('group')?.get('a')).toEqual({ x: 1, y: 2 });
    expect(cache.get('parent')?.get('group')).toEqual({ x: 15, y: 25 });
  });
});

describe('updateSubtreeGroupCaches', () => {
  it('updates caches for the group and descendant folderGroups', () => {
    const cache: PositionCache = new Map();
    const nodes = [
      node('root', { type: 'folderGroup' }),
      node('group', { type: 'folderGroup', parentId: 'root', position: { x: 10, y: 10 } }),
      node('child', { type: 'folderGroup', parentId: 'group', position: { x: 20, y: 20 } }),
      node('file', { parentId: 'child', position: { x: 30, y: 30 } }),
    ];
    const parentByNode = new Map<string, string | null>([
      ['root', null],
      ['group', 'root'],
      ['child', 'group'],
      ['file', 'child'],
    ]);

    updateSubtreeGroupCaches(cache, nodes, parentByNode, 'group');

    expect(cache.get('group')?.get('child')).toEqual({ x: 20, y: 20 });
    expect(cache.get('child')?.get('file')).toEqual({ x: 30, y: 30 });
    expect(cache.get('root')?.get('group')).toEqual({ x: 10, y: 10 });
  });

  it('also updates the parent group cache', () => {
    const cache: PositionCache = new Map();
    const nodes = [
      node('parent', { type: 'folderGroup' }),
      node('group', { type: 'folderGroup', parentId: 'parent', position: { x: 7, y: 8 } }),
      node('a', { parentId: 'group', position: { x: 1, y: 1 } }),
    ];
    const parentByNode = new Map<string, string | null>([
      ['parent', null],
      ['group', 'parent'],
      ['a', 'group'],
    ]);

    updateSubtreeGroupCaches(cache, nodes, parentByNode, 'group');

    expect(cache.get('parent')?.get('group')).toEqual({ x: 7, y: 8 });
  });

  it('skips non-folderGroup nodes as cache targets', () => {
    const cache: PositionCache = new Map();
    const nodes = [
      node('group', { type: 'folderGroup' }),
      node('file', { parentId: 'group', position: { x: 1, y: 2 } }),
      node('nested-file', { parentId: 'file', position: { x: 3, y: 4 } }),
    ];
    const parentByNode = new Map<string, string | null>([
      ['group', null],
      ['file', 'group'],
      ['nested-file', 'file'],
    ]);

    updateSubtreeGroupCaches(cache, nodes, parentByNode, 'group');

    expect(cache.has('file')).toBe(false);
    expect(cache.get('group')?.get('file')).toEqual({ x: 1, y: 2 });
  });
});
