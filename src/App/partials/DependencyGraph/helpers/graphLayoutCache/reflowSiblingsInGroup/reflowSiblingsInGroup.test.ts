import { describe, expect, it } from 'vitest';

import { GRID_GAP_X, GRID_GAP_Y } from '../../buildGraph';
import { createTestNode as node } from '../createTestNode';
import { reflowSiblingsInGroup } from './reflowSiblingsInGroup';

describe('reflowSiblingsInGroup', () => {
  it('returns false when the group has at most one child', () => {
    const nodeById = new Map([
      ['folder-a', node('folder-a', { type: 'folderGroup' })],
      ['file-a', node('file-a', { parentId: 'folder-a' })],
    ]);
    const parentByNode = new Map<string, string | null>([
      ['folder-a', null],
      ['file-a', 'folder-a'],
    ]);

    expect(reflowSiblingsInGroup('folder-a', nodeById, parentByNode)).toBe(false);
  });

  it('pushes an overlapping sibling down when nothing is fixed', () => {
    const nodeById = new Map([
      ['folder-a', node('folder-a', { type: 'folderGroup', width: 400, height: 200 })],
      [
        'file-a',
        node('file-a', {
          parentId: 'folder-a',
          position: { x: 0, y: 50 },
          width: 120,
          height: 32,
        }),
      ],
      [
        'file-b',
        node('file-b', {
          parentId: 'folder-a',
          position: { x: 50, y: 50 },
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

    expect(reflowSiblingsInGroup('folder-a', nodeById, parentByNode)).toBe(true);
    expect(nodeById.get('file-a')?.position).toEqual({ x: 0, y: 50 });
    expect(nodeById.get('file-b')!.position.y).toBeGreaterThanOrEqual(50 + 32 + GRID_GAP_Y);
  });

  it('keeps a fixed node in place and moves the non-fixed sibling away', () => {
    const nodeById = new Map([
      ['folder-a', node('folder-a', { type: 'folderGroup', width: 400, height: 200 })],
      [
        'file-a',
        node('file-a', {
          parentId: 'folder-a',
          position: { x: 50, y: 50 },
          width: 120,
          height: 32,
        }),
      ],
      [
        'file-b',
        node('file-b', {
          parentId: 'folder-a',
          position: { x: 0, y: 50 },
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

    expect(reflowSiblingsInGroup('folder-a', nodeById, parentByNode, new Set(['file-a']))).toBe(true);
    expect(nodeById.get('file-a')?.position).toEqual({ x: 50, y: 50 });
    const fileB = nodeById.get('file-b')!;
    expect(fileB.position.x !== 0 || fileB.position.y !== 50).toBe(true);
    expect(fileB.position.y >= 50 + 32 + GRID_GAP_Y || fileB.position.x >= 50 + 120 + GRID_GAP_X).toBe(true);
  });

  it('pushes right when vertical separation alone cannot clear overlap', () => {
    const nodeById = new Map([
      ['folder-a', node('folder-a', { type: 'folderGroup', width: 500, height: 80 })],
      [
        'file-a',
        node('file-a', {
          parentId: 'folder-a',
          position: { x: 0, y: 50 },
          width: 200,
          height: 100,
        }),
      ],
      [
        'file-b',
        node('file-b', {
          parentId: 'folder-a',
          position: { x: 50, y: 50 },
          width: 200,
          height: 100,
        }),
      ],
    ]);
    const parentByNode = new Map<string, string | null>([
      ['folder-a', null],
      ['file-a', 'folder-a'],
      ['file-b', 'folder-a'],
    ]);

    expect(reflowSiblingsInGroup('folder-a', nodeById, parentByNode)).toBe(true);

    const fileA = nodeById.get('file-a')!;
    const fileB = nodeById.get('file-b')!;
    const stillOverlap =
      fileA.position.x < fileB.position.x + 200 &&
      fileA.position.x + 200 > fileB.position.x &&
      fileA.position.y < fileB.position.y + 100 &&
      fileA.position.y + 100 > fileB.position.y;
    expect(stillOverlap).toBe(false);
  });

  it('clears a chain of three overlapping siblings across multiple passes', () => {
    const nodeById = new Map([
      ['folder-a', node('folder-a', { type: 'folderGroup', width: 600, height: 400 })],
      [
        'file-a',
        node('file-a', {
          parentId: 'folder-a',
          position: { x: 0, y: 50 },
          width: 120,
          height: 32,
        }),
      ],
      [
        'file-b',
        node('file-b', {
          parentId: 'folder-a',
          position: { x: 40, y: 50 },
          width: 120,
          height: 32,
        }),
      ],
      [
        'file-c',
        node('file-c', {
          parentId: 'folder-a',
          position: { x: 80, y: 50 },
          width: 120,
          height: 32,
        }),
      ],
    ]);
    const parentByNode = new Map<string, string | null>([
      ['folder-a', null],
      ['file-a', 'folder-a'],
      ['file-b', 'folder-a'],
      ['file-c', 'folder-a'],
    ]);

    expect(reflowSiblingsInGroup('folder-a', nodeById, parentByNode)).toBe(true);

    const siblings = ['file-a', 'file-b', 'file-c'].map(id => nodeById.get(id)!);
    siblings.forEach((left, i) => {
      siblings.slice(i + 1).forEach(right => {
        const overlap =
          left.position.x < right.position.x + 120 &&
          left.position.x + 120 > right.position.x &&
          left.position.y < right.position.y + 32 &&
          left.position.y + 32 > right.position.y;
        expect(overlap).toBe(false);
      });
    });
  });
});
