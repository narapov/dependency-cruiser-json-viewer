import { describe, expect, it } from 'vitest';

import { updateGroupCacheFromNodes } from '../applyPositionCache';
import { createTestNode as node } from '../createTestNode';
import type { PositionCache } from '../types';
import { getAbsoluteNodePosition, migrateReparentedNodePositions } from './migrateReparentedNodePositions';

describe('getAbsoluteNodePosition', () => {
  it('returns position for root nodes', () => {
    const nodeById = new Map([['a', node('a', { position: { x: 100, y: 200 } })]]);
    const parentByNode = new Map<string, string | null>([['a', null]]);

    expect(getAbsoluteNodePosition('a', nodeById, parentByNode)).toEqual({ x: 100, y: 200 });
  });

  it('accumulates parent offsets for nested nodes', () => {
    const nodeById = new Map([
      ['parent', node('parent', { type: 'folderGroup', position: { x: 50, y: 50 } })],
      ['child', node('child', { parentId: 'parent', position: { x: 150, y: 100 } })],
    ]);
    const parentByNode = new Map<string, string | null>([
      ['parent', null],
      ['child', 'parent'],
    ]);

    expect(getAbsoluteNodePosition('child', nodeById, parentByNode)).toEqual({ x: 200, y: 150 });
  });
});

describe('migrateReparentedNodePositions', () => {
  it('preserves canvas position when a descendant moves into an expanded ancestor', () => {
    const previousParentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/foo', null],
    ]);
    const previousNodes = [
      node('src', { type: 'folder', position: { x: 50, y: 50 }, width: 120, height: 40 }),
      node('src/foo', { type: 'folderGroup', position: { x: 200, y: 150 }, width: 250, height: 200 }),
    ];
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/foo', 'src'],
    ]);
    const nodes = [
      node('src', { type: 'folderGroup', position: { x: 50, y: 50 }, width: 120, height: 40 }),
      node('src/foo', { type: 'folderGroup', parentId: 'src', position: { x: 16, y: 52 }, width: 250, height: 200 }),
    ];
    const cache: PositionCache = new Map();

    const result = migrateReparentedNodePositions(nodes, parentByNode, previousParentByNode, previousNodes, cache);

    expect(result.find(n => n.id === 'src/foo')?.position).toEqual({ x: 150, y: 100 });
    expect(getAbsoluteNodePosition('src/foo', new Map(result.map(n => [n.id, n])), parentByNode)).toEqual({
      x: 200,
      y: 150,
    });
  });

  it('seeds the new parent group cache with migrated positions', () => {
    const previousParentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/foo', null],
    ]);
    const previousNodes = [
      node('src', { type: 'folder', position: { x: 50, y: 50 } }),
      node('src/foo', { type: 'folderGroup', position: { x: 200, y: 150 } }),
    ];
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/foo', 'src'],
    ]);
    const nodes = [
      node('src', { type: 'folderGroup', position: { x: 50, y: 50 } }),
      node('src/foo', { type: 'folderGroup', parentId: 'src', position: { x: 0, y: 0 } }),
    ];
    const cache: PositionCache = new Map();

    migrateReparentedNodePositions(nodes, parentByNode, previousParentByNode, previousNodes, cache);

    expect(cache.get('src')?.get('src/foo')).toEqual({ x: 150, y: 100 });
  });

  it('returns nodes unchanged when there is no previous layout state', () => {
    const nodes = [node('a', { position: { x: 10, y: 20 } })];
    const parentByNode = new Map<string, string | null>([['a', null]]);

    expect(migrateReparentedNodePositions(nodes, parentByNode, null, null, new Map())).toBe(nodes);
  });

  it('returns nodes unchanged when parent mapping did not change', () => {
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/foo', 'src'],
    ]);
    const previousNodes = [
      node('src', { type: 'folderGroup', position: { x: 0, y: 0 } }),
      node('src/foo', { type: 'folderGroup', parentId: 'src', position: { x: 16, y: 52 } }),
    ];
    const nodes = [...previousNodes];
    const cache: PositionCache = new Map();

    expect(migrateReparentedNodePositions(nodes, parentByNode, parentByNode, previousNodes, cache)).toEqual(nodes);
  });

  it('does not overwrite unrelated cached groups', () => {
    const previousParentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/foo', null],
      ['lib', null],
    ]);
    const previousNodes = [
      node('src', { type: 'folder', position: { x: 50, y: 50 } }),
      node('src/foo', { type: 'folderGroup', position: { x: 200, y: 150 } }),
      node('lib', { type: 'folder', position: { x: 400, y: 50 } }),
    ];
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/foo', 'src'],
      ['lib', null],
    ]);
    const nodes = [
      node('src', { type: 'folderGroup', position: { x: 50, y: 50 } }),
      node('src/foo', { type: 'folderGroup', parentId: 'src', position: { x: 0, y: 0 } }),
      node('lib', { type: 'folder', position: { x: 400, y: 50 } }),
    ];
    const cache: PositionCache = new Map([[null, new Map([['lib', { x: 400, y: 50 }]])]]);
    updateGroupCacheFromNodes(cache, previousNodes, previousParentByNode, null);

    migrateReparentedNodePositions(nodes, parentByNode, previousParentByNode, previousNodes, cache);

    expect(cache.get(null)?.get('lib')).toEqual({ x: 400, y: 50 });
    expect(cache.get('src')?.get('src/foo')).toEqual({ x: 150, y: 100 });
  });
});
