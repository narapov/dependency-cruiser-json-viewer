import { describe, expect, it } from 'vitest';

import { buildGroupFingerprints } from '../buildGroupFingerprints';
import { createTestNode as node } from '../createTestNode';
import { collectGroupsNeedingReflow } from './collectGroupsNeedingReflow';

describe('collectGroupsNeedingReflow', () => {
  it('adds the parent group when a node size changes', () => {
    const parentByNode = new Map<string, string | null>([
      ['folder-a', null],
      ['file-a', 'folder-a'],
      ['file-b', 'folder-a'],
    ]);
    const nodes = [
      node('folder-a', { type: 'folderGroup', width: 400, height: 200 }),
      node('file-a', { parentId: 'folder-a', width: 200, height: 32 }),
      node('file-b', { parentId: 'folder-a', width: 120, height: 32 }),
    ];
    const previousSizes = new Map([
      ['folder-a', { width: 400, height: 200 }],
      ['file-a', { width: 120, height: 32 }],
      ['file-b', { width: 120, height: 32 }],
    ]);

    const groups = collectGroupsNeedingReflow(nodes, parentByNode, previousSizes, null, null);

    expect(groups.has('folder-a')).toBe(true);
  });

  it('adds null when a root-level node size changes', () => {
    const parentByNode = new Map<string, string | null>([
      ['a', null],
      ['b', null],
    ]);
    const nodes = [node('a', { width: 200, height: 32 }), node('b', { width: 120, height: 32 })];
    const previousSizes = new Map([
      ['a', { width: 120, height: 32 }],
      ['b', { width: 120, height: 32 }],
    ]);

    const groups = collectGroupsNeedingReflow(nodes, parentByNode, previousSizes, null, null);

    expect(groups.has(null)).toBe(true);
  });

  it('adds a group when its fingerprint changes', () => {
    const parentByNode = new Map<string, string | null>([
      ['folder-a', null],
      ['file-a', 'folder-a'],
      ['file-b', 'folder-a'],
    ]);
    const nodes = [
      node('folder-a', { type: 'folderGroup', width: 400, height: 200 }),
      node('file-a', {
        parentId: 'folder-a',
        position: { x: 0, y: 50 },
        width: 120,
        height: 32,
      }),
      node('file-b', {
        parentId: 'folder-a',
        position: { x: 200, y: 50 },
        width: 120,
        height: 32,
      }),
    ];
    const previousSizes = new Map([
      ['folder-a', { width: 400, height: 200 }],
      ['file-a', { width: 120, height: 32 }],
      ['file-b', { width: 120, height: 32 }],
    ]);
    const previousFingerprints = buildGroupFingerprints(new Set(['folder-a', 'file-a']), parentByNode);
    const currentFingerprints = buildGroupFingerprints(new Set(['folder-a', 'file-a', 'file-b']), parentByNode);

    const groups = collectGroupsNeedingReflow(
      nodes,
      parentByNode,
      previousSizes,
      currentFingerprints,
      previousFingerprints,
    );

    expect(groups.has('folder-a')).toBe(true);
  });

  it('adds a group when siblings overlap even without size or fingerprint change', () => {
    const parentByNode = new Map<string, string | null>([
      ['folder-a', null],
      ['file-a', 'folder-a'],
      ['file-b', 'folder-a'],
    ]);
    const nodes = [
      node('folder-a', { type: 'folderGroup', width: 400, height: 200 }),
      node('file-a', {
        parentId: 'folder-a',
        position: { x: 0, y: 50 },
        width: 120,
        height: 32,
      }),
      node('file-b', {
        parentId: 'folder-a',
        position: { x: 50, y: 50 },
        width: 120,
        height: 32,
      }),
    ];
    const previousSizes = new Map([
      ['folder-a', { width: 400, height: 200 }],
      ['file-a', { width: 120, height: 32 }],
      ['file-b', { width: 120, height: 32 }],
    ]);
    const fingerprints = buildGroupFingerprints(new Set(['folder-a', 'file-a', 'file-b']), parentByNode);

    const groups = collectGroupsNeedingReflow(nodes, parentByNode, previousSizes, fingerprints, fingerprints);

    expect(groups.has('folder-a')).toBe(true);
  });

  it('returns an empty set when sizes, fingerprints, and layout are stable', () => {
    const parentByNode = new Map<string, string | null>([
      ['folder-a', null],
      ['file-a', 'folder-a'],
      ['file-b', 'folder-a'],
    ]);
    const nodes = [
      node('folder-a', { type: 'folderGroup', width: 400, height: 200 }),
      node('file-a', {
        parentId: 'folder-a',
        position: { x: 0, y: 50 },
        width: 120,
        height: 32,
      }),
      node('file-b', {
        parentId: 'folder-a',
        position: { x: 200, y: 50 },
        width: 120,
        height: 32,
      }),
    ];
    const previousSizes = new Map([
      ['folder-a', { width: 400, height: 200 }],
      ['file-a', { width: 120, height: 32 }],
      ['file-b', { width: 120, height: 32 }],
    ]);
    const fingerprints = buildGroupFingerprints(new Set(['folder-a', 'file-a', 'file-b']), parentByNode);

    const groups = collectGroupsNeedingReflow(nodes, parentByNode, previousSizes, fingerprints, fingerprints);

    expect(groups.size).toBe(0);
  });

  it('still detects size-change parents when fingerprints are null', () => {
    const parentByNode = new Map<string, string | null>([
      ['a', null],
      ['b', null],
    ]);
    const nodes = [
      node('a', { position: { x: 0, y: 0 }, width: 200, height: 32 }),
      node('b', { position: { x: 50, y: 0 }, width: 120, height: 32 }),
    ];
    const previousSizes = new Map([
      ['a', { width: 120, height: 32 }],
      ['b', { width: 120, height: 32 }],
    ]);

    const groups = collectGroupsNeedingReflow(nodes, parentByNode, previousSizes, null, null);

    expect(groups.has(null)).toBe(true);
    expect(groups.size).toBe(1);
  });
});
