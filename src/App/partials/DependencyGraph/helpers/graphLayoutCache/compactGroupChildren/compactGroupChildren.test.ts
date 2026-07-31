import { describe, expect, it } from 'vitest';

import { GROUP_HEADER, GROUP_PADDING } from '../../buildGraph';
import { createTestNode as node } from '../createTestNode';
import { collectGroupsToCompact, compactGroupChildren } from './compactGroupChildren';

describe('compactGroupChildren', () => {
  it('returns false when the group has no children', () => {
    const nodeById = new Map([['folder-a', node('folder-a', { type: 'folderGroup' })]]);
    const parentByNode = new Map<string, string | null>([['folder-a', null]]);

    expect(compactGroupChildren('folder-a', nodeById, parentByNode)).toBe(false);
  });

  it('returns false when children already sit at padding', () => {
    const nodeById = new Map([
      ['folder-a', node('folder-a', { type: 'folderGroup' })],
      [
        'file-a',
        node('file-a', {
          parentId: 'folder-a',
          position: { x: GROUP_PADDING, y: GROUP_HEADER + GROUP_PADDING },
        }),
      ],
    ]);
    const parentByNode = new Map<string, string | null>([
      ['folder-a', null],
      ['file-a', 'folder-a'],
    ]);

    expect(compactGroupChildren('folder-a', nodeById, parentByNode)).toBe(false);
    expect(nodeById.get('file-a')?.position).toEqual({
      x: GROUP_PADDING,
      y: GROUP_HEADER + GROUP_PADDING,
    });
  });

  it('shifts children so the content hugs GROUP_PADDING / GROUP_HEADER', () => {
    const nodeById = new Map([
      ['folder-a', node('folder-a', { type: 'folderGroup' })],
      [
        'file-a',
        node('file-a', {
          parentId: 'folder-a',
          position: { x: 50, y: 80 },
          width: 120,
          height: 32,
        }),
      ],
      [
        'file-b',
        node('file-b', {
          parentId: 'folder-a',
          position: { x: 200, y: 80 },
          width: 120,
          height: 32,
        }),
      ],
    ]);
    const parentByNode = new Map<string, string | null>([
      ['folder-a', null],
      ['file-a', 'folder-a'],
      ['file-b', 'folder-a'],
    ]);

    expect(compactGroupChildren('folder-a', nodeById, parentByNode)).toBe(true);
    expect(nodeById.get('file-a')?.position).toEqual({
      x: GROUP_PADDING,
      y: GROUP_HEADER + GROUP_PADDING,
    });
    expect(nodeById.get('file-b')?.position).toEqual({
      x: 200 - 50 + GROUP_PADDING,
      y: GROUP_HEADER + GROUP_PADDING,
    });
  });
});

describe('collectGroupsToCompact', () => {
  it('returns ancestors including null, deepest first, for a dragged file', () => {
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

    expect(collectGroupsToCompact('parent/child/file', nodeById, parentByNode)).toEqual([
      'parent/child',
      'parent',
      null,
    ]);
  });

  it('includes the dragged node when it is a folderGroup', () => {
    const parentByNode = new Map<string, string | null>([
      ['parent', null],
      ['parent/child', 'parent'],
    ]);
    const nodeById = new Map([
      ['parent', node('parent', { type: 'folderGroup' })],
      ['parent/child', node('parent/child', { type: 'folderGroup', parentId: 'parent' })],
    ]);

    expect(collectGroupsToCompact('parent/child', nodeById, parentByNode)).toEqual(['parent/child', 'parent', null]);
  });
});
