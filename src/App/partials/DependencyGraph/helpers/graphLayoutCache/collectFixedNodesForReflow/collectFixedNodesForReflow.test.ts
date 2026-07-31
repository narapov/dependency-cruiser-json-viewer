import { describe, expect, it } from 'vitest';

import { createTestNode as node } from '../createTestNode';
import { collectFixedNodesForReflow } from './collectFixedNodesForReflow';

describe('collectFixedNodesForReflow', () => {
  it('marks a singly expanded folder as fixed', () => {
    const parentByNode = new Map<string, string | null>([
      ['folder-a', null],
      ['folder-b', null],
    ]);
    const previousNodes = [
      node('folder-a', { type: 'folder', width: 120, height: 40 }),
      node('folder-b', { type: 'folder', width: 120, height: 40 }),
    ];
    const nodes = [
      node('folder-a', { type: 'folderGroup', width: 250, height: 200 }),
      node('folder-b', { type: 'folder', width: 120, height: 40 }),
    ];
    const previousSizes = new Map([
      ['folder-a', { width: 120, height: 40 }],
      ['folder-b', { width: 120, height: 40 }],
    ]);

    const fixed = collectFixedNodesForReflow(nodes, previousSizes, previousNodes, parentByNode);

    expect(fixed.has('folder-a')).toBe(true);
    expect(fixed.has('folder-b')).toBe(false);
  });

  it('does not fix multi-expand siblings from expansion alone', () => {
    const parentByNode = new Map<string, string | null>([
      ['root', null],
      ['root/a', 'root'],
      ['root/b', 'root'],
    ]);
    const previousNodes = [
      node('root', { type: 'folderGroup', width: 400, height: 100 }),
      node('root/a', { type: 'folder', parentId: 'root', width: 120, height: 40 }),
      node('root/b', { type: 'folder', parentId: 'root', width: 120, height: 40 }),
    ];
    const nodes = [
      node('root', { type: 'folderGroup', width: 400, height: 300 }),
      node('root/a', { type: 'folderGroup', parentId: 'root', width: 200, height: 150 }),
      node('root/b', { type: 'folderGroup', parentId: 'root', width: 200, height: 150 }),
    ];
    const previousSizes = new Map([
      ['root', { width: 400, height: 100 }],
      ['root/a', { width: 120, height: 40 }],
      ['root/b', { width: 120, height: 40 }],
    ]);

    const fixed = collectFixedNodesForReflow(nodes, previousSizes, previousNodes, parentByNode);

    expect(fixed.has('root/a')).toBe(false);
    expect(fixed.has('root/b')).toBe(false);
  });

  it('marks a node as fixed when its size grows', () => {
    const parentByNode = new Map<string, string | null>([
      ['a', null],
      ['b', null],
    ]);
    const nodes = [node('a', { width: 200, height: 32 }), node('b', { width: 120, height: 32 })];
    const previousSizes = new Map([
      ['a', { width: 120, height: 32 }],
      ['b', { width: 120, height: 32 }],
    ]);

    const fixed = collectFixedNodesForReflow(nodes, previousSizes, null, parentByNode);

    expect(fixed.has('a')).toBe(true);
    expect(fixed.has('b')).toBe(false);
  });

  it('skips nodes with no previous size', () => {
    const parentByNode = new Map<string, string | null>([['a', null]]);
    const nodes = [node('a', { width: 200, height: 32 })];
    const previousSizes = new Map<string, { width: number; height: number }>();

    const fixed = collectFixedNodesForReflow(nodes, previousSizes, null, parentByNode);

    expect(fixed.has('a')).toBe(false);
  });

  it('keeps multi-expand ids out of fixed even when size grew', () => {
    const parentByNode = new Map<string, string | null>([
      ['root', null],
      ['root/a', 'root'],
      ['root/b', 'root'],
    ]);
    const previousNodes = [
      node('root', { type: 'folderGroup', width: 400, height: 100 }),
      node('root/a', { type: 'folder', parentId: 'root', width: 120, height: 40 }),
      node('root/b', { type: 'folder', parentId: 'root', width: 120, height: 40 }),
    ];
    const nodes = [
      node('root', { type: 'folderGroup', width: 400, height: 300 }),
      node('root/a', { type: 'folderGroup', parentId: 'root', width: 250, height: 200 }),
      node('root/b', { type: 'folderGroup', parentId: 'root', width: 250, height: 200 }),
    ];
    const previousSizes = new Map([
      ['root', { width: 400, height: 100 }],
      ['root/a', { width: 120, height: 40 }],
      ['root/b', { width: 120, height: 40 }],
    ]);

    const fixed = collectFixedNodesForReflow(nodes, previousSizes, previousNodes, parentByNode);

    expect(fixed.has('root/a')).toBe(false);
    expect(fixed.has('root/b')).toBe(false);
  });
});
