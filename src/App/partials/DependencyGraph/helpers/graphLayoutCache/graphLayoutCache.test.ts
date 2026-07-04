import { describe, expect, it } from 'vitest';

import type { Node } from '@xyflow/react';

import { GRID_GAP_X, GROUP_HEADER, GROUP_PADDING } from '../buildGraph';
import {
  applyAutoLayoutGroupLevel,
  applyAutoLayoutSubtree,
  applyPositionCache,
  preserveExpandedGroupPositions,
} from './applyPositionCache';
import { buildGroupFingerprints } from './buildGroupFingerprints';
import {
  invalidateGroupPositionCache,
  invalidateGroupPositionCacheRecursive,
  invalidatePositionCache,
} from './invalidatePositionCache';
import {
  collectNodeSizes,
  compactAfterDrag,
  reflowForDrag,
  reflowParentSiblings,
  resizeGroupsForNode,
} from './reflowParentSiblings';
import type { PositionCache } from './types';

function node(id: string, overrides: Partial<Node> = {}): Node {
  return {
    id,
    type: 'file',
    position: { x: 0, y: 0 },
    data: {},
    width: 120,
    height: 32,
    ...overrides,
  };
}

describe('buildGroupFingerprints', () => {
  it('builds fingerprint from sorted direct children', () => {
    const parentByNode = new Map<string, string | null>([
      ['a', null],
      ['b', null],
      ['c', 'a'],
    ]);
    const fingerprints = buildGroupFingerprints(new Set(['a', 'b', 'c']), parentByNode);

    expect(fingerprints.get(null)).toBe('a,b');
    expect(fingerprints.get('a')).toBe('c');
  });
});

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
});

describe('resizeGroupsForNode', () => {
  it('expands nested folder groups hierarchically when child moves near edge', () => {
    const parentByNode = new Map<string, string | null>([
      ['parent', null],
      ['parent/child', 'parent'],
      ['parent/child/file', 'parent/child'],
    ]);
    const nodes = [
      node('parent', { type: 'folderGroup', width: 200, height: 200 }),
      node('parent/child', {
        type: 'folderGroup',
        parentId: 'parent',
        width: 150,
        height: 150,
        position: { x: 10, y: 50 },
      }),
      node('parent/child/file', {
        parentId: 'parent/child',
        width: 120,
        height: 32,
        position: { x: 200, y: 100 },
      }),
    ];

    const result = resizeGroupsForNode(nodes, parentByNode, 'parent/child/file');

    const inner = result.find(n => n.id === 'parent/child');
    const outer = result.find(n => n.id === 'parent');

    expect(inner!.width!).toBeGreaterThan(150);
    expect(outer!.width!).toBeGreaterThan(200);
  });
});

describe('reflowForDrag', () => {
  it('shifts overlapping sibling while keeping dragged node at dropped position', () => {
    const parentByNode = new Map<string, string | null>([
      ['folder-a', null],
      ['file-a', 'folder-a'],
      ['file-b', 'folder-a'],
    ]);
    const nodes = [
      node('folder-a', { type: 'folderGroup', width: 400, height: 200 }),
      node('file-a', { parentId: 'folder-a', position: { x: 0, y: 50 }, width: 120, height: 32 }),
      node('file-b', { parentId: 'folder-a', position: { x: 130, y: 50 }, width: 120, height: 32 }),
    ];
    const previousSizes = collectNodeSizes(nodes);
    const draggedPosition = { x: 130, y: 50 };

    const result = reflowForDrag(nodes, parentByNode, 'file-a', draggedPosition, previousSizes);

    expect(result.find(n => n.id === 'file-a')?.position).toEqual(draggedPosition);
    const fileB = result.find(n => n.id === 'file-b');
    expect(fileB!.position.x).toBeGreaterThanOrEqual(130 + 120 + GRID_GAP_X);
  });

  it('expands folder group when dragged file moves near edge', () => {
    const parentByNode = new Map<string, string | null>([
      ['parent', null],
      ['parent/child', 'parent'],
      ['parent/child/file', 'parent/child'],
    ]);
    const nodes = [
      node('parent', { type: 'folderGroup', width: 200, height: 200 }),
      node('parent/child', {
        type: 'folderGroup',
        parentId: 'parent',
        width: 150,
        height: 150,
        position: { x: 10, y: 50 },
      }),
      node('parent/child/file', {
        parentId: 'parent/child',
        width: 120,
        height: 32,
        position: { x: 10, y: 50 },
      }),
    ];
    const previousSizes = collectNodeSizes(nodes);
    const draggedPosition = { x: 200, y: 100 };

    const result = reflowForDrag(nodes, parentByNode, 'parent/child/file', draggedPosition, previousSizes);

    const inner = result.find(n => n.id === 'parent/child');
    const outer = result.find(n => n.id === 'parent');
    expect(inner!.width!).toBeGreaterThan(150);
    expect(outer!.width!).toBeGreaterThan(200);
    expect(result.find(n => n.id === 'parent/child/file')?.position).toEqual(draggedPosition);
  });

  it('shifts sibling folder group when ancestor grows into it', () => {
    const parentByNode = new Map<string, string | null>([
      ['group-a', null],
      ['group-b', null],
      ['file-a', 'group-a'],
    ]);
    const nodes = [
      node('group-a', { type: 'folderGroup', width: 200, height: 200, position: { x: 0, y: 0 } }),
      node('group-b', { type: 'folderGroup', width: 200, height: 200, position: { x: 210, y: 0 } }),
      node('file-a', { parentId: 'group-a', width: 120, height: 32, position: { x: 10, y: 50 } }),
    ];
    const previousSizes = collectNodeSizes(nodes);
    const draggedPosition = { x: 180, y: 50 };

    const result = reflowForDrag(nodes, parentByNode, 'file-a', draggedPosition, previousSizes);

    const groupA = result.find(n => n.id === 'group-a');
    const groupB = result.find(n => n.id === 'group-b');
    expect(groupA!.width!).toBeGreaterThan(200);
    expect(groupB!.position.x).toBeGreaterThan(210);
  });
});

describe('compactAfterDrag', () => {
  it('shifts children to minimum padding and shrinks folder group', () => {
    const parentByNode = new Map<string, string | null>([
      ['folder-a', null],
      ['file-a', 'folder-a'],
      ['file-b', 'folder-a'],
    ]);
    const nodes = [
      node('folder-a', { type: 'folderGroup', width: 400, height: 200 }),
      node('file-a', { parentId: 'folder-a', position: { x: 50, y: 80 }, width: 120, height: 32 }),
      node('file-b', { parentId: 'folder-a', position: { x: 200, y: 80 }, width: 120, height: 32 }),
    ];

    const result = compactAfterDrag(nodes, parentByNode, 'file-a');

    expect(result.find(n => n.id === 'file-a')?.position).toEqual({
      x: GROUP_PADDING,
      y: GROUP_HEADER + GROUP_PADDING,
    });
    expect(result.find(n => n.id === 'file-b')?.position).toEqual({
      x: 200 - 50 + GROUP_PADDING,
      y: GROUP_HEADER + GROUP_PADDING,
    });

    const folder = result.find(n => n.id === 'folder-a');
    expect(folder!.width).toBe(200 - 50 + GROUP_PADDING + 120 + GROUP_PADDING);
    expect(folder!.height).toBe(GROUP_HEADER + GROUP_PADDING + 32 + GROUP_PADDING);
  });

  it('compacts ancestor folder groups from innermost to outermost', () => {
    const parentByNode = new Map<string, string | null>([
      ['parent', null],
      ['parent/child', 'parent'],
      ['parent/child/file', 'parent/child'],
    ]);
    const nodes = [
      node('parent', { type: 'folderGroup', width: 400, height: 300, position: { x: 0, y: 0 } }),
      node('parent/child', {
        type: 'folderGroup',
        parentId: 'parent',
        width: 300,
        height: 200,
        position: { x: 40, y: 90 },
      }),
      node('parent/child/file', {
        parentId: 'parent/child',
        width: 120,
        height: 32,
        position: { x: 30, y: 70 },
      }),
    ];

    const result = compactAfterDrag(nodes, parentByNode, 'parent/child/file');

    expect(result.find(n => n.id === 'parent/child/file')?.position).toEqual({
      x: GROUP_PADDING,
      y: GROUP_HEADER + GROUP_PADDING,
    });
    expect(result.find(n => n.id === 'parent/child')?.position).toEqual({
      x: GROUP_PADDING,
      y: GROUP_HEADER + GROUP_PADDING,
    });
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

describe('reflowParentSiblings on expand', () => {
  it('keeps expanded group in place and shifts overlapping siblings', () => {
    const parentByNode = new Map<string, string | null>([
      ['folder-a', null],
      ['folder-b', null],
      ['file-1', 'folder-a'],
      ['file-2', 'folder-a'],
    ]);
    const previousNodes = [
      node('folder-a', { type: 'folder', position: { x: 0, y: 50 }, width: 120, height: 40 }),
      node('folder-b', { type: 'folder', position: { x: 150, y: 50 }, width: 120, height: 40 }),
    ];
    const previousSizes = collectNodeSizes(previousNodes);
    const grownNodes = [
      node('folder-a', { type: 'folderGroup', position: { x: 0, y: 50 }, width: 250, height: 200 }),
      node('file-1', { parentId: 'folder-a', position: { x: 16, y: 52 }, width: 120, height: 40 }),
      node('file-2', { parentId: 'folder-a', position: { x: 16, y: 100 }, width: 120, height: 40 }),
      node('folder-b', { type: 'folder', position: { x: 150, y: 50 }, width: 120, height: 40 }),
    ];
    const cache: PositionCache = new Map();
    const currentFingerprints = buildGroupFingerprints(
      new Set(['folder-a', 'file-1', 'file-2', 'folder-b']),
      parentByNode,
    );
    const previousFingerprints = buildGroupFingerprints(new Set(['folder-a', 'folder-b']), parentByNode);

    const result = reflowParentSiblings({
      nodes: grownNodes,
      parentByNode,
      previousSizes,
      cache,
      currentFingerprints,
      previousFingerprints,
      previousNodes,
    });

    const folderA = result.find(n => n.id === 'folder-a');
    const folderB = result.find(n => n.id === 'folder-b');
    expect(folderA?.position).toEqual({ x: 0, y: 50 });
    expect(folderB!.position.x).toBeGreaterThanOrEqual(0 + 250 + GRID_GAP_X);
  });

  it('shifts sibling that sits to the left of expanded group when it overlaps', () => {
    const parentByNode = new Map<string, string | null>([
      ['folder-a', null],
      ['folder-b', null],
      ['file-1', 'folder-a'],
    ]);
    const previousNodes = [
      node('folder-b', { type: 'folder', position: { x: 0, y: 50 }, width: 120, height: 40 }),
      node('folder-a', { type: 'folder', position: { x: 50, y: 50 }, width: 120, height: 40 }),
    ];
    const previousSizes = collectNodeSizes(previousNodes);
    const grownNodes = [
      node('folder-b', { type: 'folder', position: { x: 0, y: 50 }, width: 120, height: 40 }),
      node('folder-a', { type: 'folderGroup', position: { x: 50, y: 50 }, width: 250, height: 200 }),
      node('file-1', { parentId: 'folder-a', position: { x: 16, y: 52 }, width: 120, height: 40 }),
    ];
    const cache: PositionCache = new Map();
    const currentFingerprints = buildGroupFingerprints(new Set(['folder-a', 'file-1', 'folder-b']), parentByNode);
    const previousFingerprints = buildGroupFingerprints(new Set(['folder-a', 'folder-b']), parentByNode);

    const result = reflowParentSiblings({
      nodes: grownNodes,
      parentByNode,
      previousSizes,
      cache,
      currentFingerprints,
      previousFingerprints,
      previousNodes,
    });

    const folderA = result.find(n => n.id === 'folder-a');
    const folderB = result.find(n => n.id === 'folder-b');
    expect(folderA?.position).toEqual({ x: 50, y: 50 });
    expect(folderB!.position.x).toBeGreaterThanOrEqual(50 + 250 + GRID_GAP_X);
  });

  it('reflows siblings when multiple nested folders expand during recursive expand', () => {
    const parentByNode = new Map<string, string | null>([
      ['root', null],
      ['root/child-a', 'root'],
      ['root/child-b', 'root'],
      ['root/child-a/file', 'root/child-a'],
      ['root/child-b/file', 'root/child-b'],
    ]);
    const previousNodes = [node('root', { type: 'folder', position: { x: 0, y: 50 }, width: 120, height: 40 })];
    const previousSizes = collectNodeSizes(previousNodes);
    const grownNodes = [
      node('root', { type: 'folderGroup', position: { x: 0, y: 50 }, width: 500, height: 400 }),
      node('root/child-a', {
        type: 'folderGroup',
        parentId: 'root',
        position: { x: 16, y: 52 },
        width: 200,
        height: 150,
      }),
      node('root/child-b', {
        type: 'folderGroup',
        parentId: 'root',
        position: { x: 50, y: 52 },
        width: 200,
        height: 150,
      }),
      node('root/child-a/file', { parentId: 'root/child-a', position: { x: 16, y: 52 }, width: 120, height: 32 }),
      node('root/child-b/file', { parentId: 'root/child-b', position: { x: 16, y: 52 }, width: 120, height: 32 }),
    ];
    const cache: PositionCache = new Map();
    const currentFingerprints = buildGroupFingerprints(
      new Set(['root', 'root/child-a', 'root/child-a/file', 'root/child-b', 'root/child-b/file']),
      parentByNode,
    );
    const previousFingerprints = buildGroupFingerprints(new Set(['root']), parentByNode);

    const result = reflowParentSiblings({
      nodes: grownNodes,
      parentByNode,
      previousSizes,
      cache,
      currentFingerprints,
      previousFingerprints,
      previousNodes,
    });

    const root = result.find(n => n.id === 'root');
    const childA = result.find(n => n.id === 'root/child-a')!;
    const childB = result.find(n => n.id === 'root/child-b')!;
    expect(root?.position).toEqual({ x: 0, y: 50 });
    expect(childB.position.x).toBeGreaterThanOrEqual(childA.position.x + 200 + GRID_GAP_X);
  });
});

describe('reflowParentSiblings', () => {
  it('shifts siblings when a node grows in size', () => {
    const nodes = [
      node('a', { position: { x: 0, y: 0 }, width: 120, height: 32 }),
      node('b', { position: { x: 130, y: 0 }, width: 120, height: 32 }),
    ];
    const parentByNode = new Map<string, string | null>([
      ['a', null],
      ['b', null],
    ]);
    const previousSizes = collectNodeSizes(nodes);
    const cache: PositionCache = new Map();

    const grownNodes = nodes.map(n => (n.id === 'a' ? { ...n, width: 200, height: 32 } : n));
    const result = reflowParentSiblings({
      nodes: grownNodes,
      parentByNode,
      previousSizes,
      cache,
    });

    const nodeB = result.find(n => n.id === 'b');
    expect(nodeB!.position.x).toBeGreaterThanOrEqual(200 + 60);
  });

  it('reflows siblings when cached positions overlap after child reappears', () => {
    const parentByNode = new Map<string, string | null>([
      ['folder-a', null],
      ['file-a', 'folder-a'],
      ['file-b', 'folder-a'],
      ['file-c', 'folder-a'],
    ]);
    const overlappingNodes = [
      node('folder-a', { type: 'folderGroup', width: 500, height: 200 }),
      node('file-a', { parentId: 'folder-a', position: { x: 0, y: 50 }, width: 120, height: 32 }),
      node('file-b', { parentId: 'folder-a', position: { x: 50, y: 50 }, width: 120, height: 32 }),
      node('file-c', { parentId: 'folder-a', position: { x: 100, y: 50 }, width: 120, height: 32 }),
    ];
    const previousSizes = collectNodeSizes(overlappingNodes);
    const cache: PositionCache = new Map();
    const nodeIds = new Set(['folder-a', 'file-a', 'file-b']);
    const hiddenFingerprints = buildGroupFingerprints(nodeIds, parentByNode);
    const restoredFingerprints = buildGroupFingerprints(
      new Set(['folder-a', 'file-a', 'file-b', 'file-c']),
      parentByNode,
    );

    const result = reflowParentSiblings({
      nodes: overlappingNodes,
      parentByNode,
      previousSizes,
      cache,
      currentFingerprints: restoredFingerprints,
      previousFingerprints: hiddenFingerprints,
    });

    const fileA = result.find(n => n.id === 'file-a')!;
    const fileB = result.find(n => n.id === 'file-b')!;
    const fileC = result.find(n => n.id === 'file-c')!;
    expect(fileB.position.x).toBeGreaterThanOrEqual(fileA.position.x + 120 + GRID_GAP_X);
    expect(fileC.position.x).toBeGreaterThanOrEqual(fileB.position.x + 120 + GRID_GAP_X);
  });

  it('reflows siblings when restored cache positions overlap without size change', () => {
    const nodes = [
      node('a', { position: { x: 0, y: 0 }, width: 120, height: 32 }),
      node('b', { position: { x: 50, y: 0 }, width: 120, height: 32 }),
    ];
    const parentByNode = new Map<string, string | null>([
      ['a', null],
      ['b', null],
    ]);
    const previousSizes = collectNodeSizes(nodes);
    const cache: PositionCache = new Map();
    const fingerprints = buildGroupFingerprints(new Set(['a', 'b']), parentByNode);

    const result = reflowParentSiblings({
      nodes,
      parentByNode,
      previousSizes,
      cache,
      currentFingerprints: fingerprints,
      previousFingerprints: fingerprints,
    });

    const nodeB = result.find(n => n.id === 'b');
    expect(nodeB!.position.x).toBeGreaterThanOrEqual(120 + GRID_GAP_X);
  });
});
