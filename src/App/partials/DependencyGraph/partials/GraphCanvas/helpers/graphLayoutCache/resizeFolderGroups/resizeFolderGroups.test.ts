import { describe, expect, it } from 'vitest';

import { GROUP_HEADER, GROUP_PADDING } from '../../buildGraph';
import { createTestNode as node } from '../createTestNode';
import { resolveGroupSize } from '../resolveGroupSize';
import {
  getAncestorFolderGroupIds,
  hasSizeGrown,
  resizeAncestorGroups,
  resizeFolderGroups,
} from './resizeFolderGroups';

describe('resizeFolderGroups', () => {
  it('resizes nested folder groups deepest-first from current children', () => {
    const parentByNode = new Map<string, string | null>([
      ['parent', null],
      ['parent/child', 'parent'],
      ['parent/child/file', 'parent/child'],
    ]);
    const nodeById = new Map([
      [
        'parent',
        node('parent', {
          type: 'folderGroup',
          width: 100,
          height: 100,
          position: { x: 0, y: 0 },
        }),
      ],
      [
        'parent/child',
        node('parent/child', {
          type: 'folderGroup',
          parentId: 'parent',
          width: 80,
          height: 80,
          position: { x: GROUP_PADDING, y: GROUP_HEADER + GROUP_PADDING },
        }),
      ],
      [
        'parent/child/file',
        node('parent/child/file', {
          parentId: 'parent/child',
          width: 120,
          height: 32,
          position: { x: GROUP_PADDING, y: GROUP_HEADER + GROUP_PADDING },
        }),
      ],
    ]);

    resizeFolderGroups(nodeById, parentByNode);

    const expectedInner = resolveGroupSize('parent/child', [...nodeById.values()], parentByNode);
    const expectedOuter = resolveGroupSize('parent', [...nodeById.values()], parentByNode);
    expect(nodeById.get('parent/child')?.width).toBe(expectedInner.width);
    expect(nodeById.get('parent/child')?.height).toBe(expectedInner.height);
    expect(nodeById.get('parent')?.width).toBe(expectedOuter.width);
    expect(nodeById.get('parent')?.height).toBe(expectedOuter.height);
  });
});

describe('getAncestorFolderGroupIds', () => {
  it('returns deepest-first folderGroup ancestors', () => {
    const parentByNode = new Map<string, string | null>([
      ['parent', null],
      ['parent/child', 'parent'],
      ['parent/child/file', 'parent/child'],
    ]);
    const nodeById = new Map([
      ['parent', node('parent', { type: 'folderGroup' })],
      ['parent/child', node('parent/child', { type: 'folderGroup', parentId: 'parent' })],
      ['parent/child/file', node('parent/child/file', { parentId: 'parent/child' })],
    ]);

    expect(getAncestorFolderGroupIds('parent/child/file', nodeById, parentByNode)).toEqual(['parent/child', 'parent']);
  });

  it('skips ancestors that are not folderGroup nodes', () => {
    const parentByNode = new Map<string, string | null>([
      ['parent', null],
      ['parent/mid', 'parent'],
      ['parent/mid/file', 'parent/mid'],
    ]);
    const nodeById = new Map([
      ['parent', node('parent', { type: 'folderGroup' })],
      ['parent/mid', node('parent/mid', { type: 'folder', parentId: 'parent' })],
      ['parent/mid/file', node('parent/mid/file', { parentId: 'parent/mid' })],
    ]);

    expect(getAncestorFolderGroupIds('parent/mid/file', nodeById, parentByNode)).toEqual(['parent']);
  });
});

describe('resizeAncestorGroups', () => {
  it('resizes only ancestors of the given node', () => {
    const parentByNode = new Map<string, string | null>([
      ['group-a', null],
      ['group-b', null],
      ['file-a', 'group-a'],
    ]);
    const nodeById = new Map([
      [
        'group-a',
        node('group-a', {
          type: 'folderGroup',
          width: 50,
          height: 50,
          position: { x: 0, y: 0 },
        }),
      ],
      [
        'group-b',
        node('group-b', {
          type: 'folderGroup',
          width: 50,
          height: 50,
          position: { x: 200, y: 0 },
        }),
      ],
      [
        'file-a',
        node('file-a', {
          parentId: 'group-a',
          width: 120,
          height: 32,
          position: { x: GROUP_PADDING, y: GROUP_HEADER + GROUP_PADDING },
        }),
      ],
    ]);

    resizeAncestorGroups(nodeById, parentByNode, 'file-a');

    const expectedA = resolveGroupSize('group-a', [...nodeById.values()], parentByNode);
    expect(nodeById.get('group-a')?.width).toBe(expectedA.width);
    expect(nodeById.get('group-a')?.height).toBe(expectedA.height);
    expect(nodeById.get('group-b')?.width).toBe(50);
    expect(nodeById.get('group-b')?.height).toBe(50);
  });
});

describe('hasSizeGrown', () => {
  it('returns true when width or height exceeds the previous snapshot', () => {
    const nodeById = new Map([['a', node('a', { width: 200, height: 32 })]]);
    const previousSizes = new Map([['a', { width: 120, height: 32 }]]);

    expect(hasSizeGrown('a', nodeById, previousSizes)).toBe(true);
  });

  it('returns false when size is equal or previous size is missing', () => {
    const nodeById = new Map([
      ['a', node('a', { width: 120, height: 32 })],
      ['b', node('b', { width: 200, height: 40 })],
    ]);
    const previousSizes = new Map([['a', { width: 120, height: 32 }]]);

    expect(hasSizeGrown('a', nodeById, previousSizes)).toBe(false);
    expect(hasSizeGrown('b', nodeById, previousSizes)).toBe(false);
    expect(hasSizeGrown('missing', nodeById, previousSizes)).toBe(false);
  });
});
