import { describe, expect, it } from 'vitest';

import type { Edge, Node } from '@xyflow/react';

import { collectSiblingRoutingLevels } from './collectSiblingRoutingLevels';

function makeNode(id: string, overrides: Partial<Node> = {}): Node {
  return {
    id,
    position: { x: 0, y: 0 },
    data: {},
    ...overrides,
  };
}

describe('collectSiblingRoutingLevels', () => {
  it('returns a single root level for flat sibling edges', () => {
    const nodes = [makeNode('a.ts', { type: 'file' }), makeNode('b.ts', { type: 'file' })];
    const edges: Edge[] = [{ id: 'a.ts->b.ts', source: 'a.ts', target: 'b.ts' }];
    const parentByNode = new Map<string, string | null>([
      ['a.ts', null],
      ['b.ts', null],
    ]);

    const levels = collectSiblingRoutingLevels(nodes, edges, parentByNode);

    expect(levels).toHaveLength(1);
    expect(levels[0]?.folderId).toBeNull();
    expect(levels[0]?.nodes.map(node => node.id)).toEqual(['a.ts', 'b.ts']);
    expect(levels[0]?.edges.map(edge => edge.id)).toEqual(['a.ts->b.ts']);
  });

  it('routes nested sibling edges before the parent level (bottom-up)', () => {
    const nodes = [
      makeNode('src', { type: 'folderGroup' }),
      makeNode('src/foo', { type: 'folderGroup', parentId: 'src' }),
      makeNode('src/foo/a.ts', { type: 'file', parentId: 'src/foo' }),
      makeNode('src/foo/b.ts', { type: 'file', parentId: 'src/foo' }),
      makeNode('src/bar.ts', { type: 'file', parentId: 'src' }),
    ];
    const edges: Edge[] = [
      { id: 'src/foo/a.ts->src/foo/b.ts', source: 'src/foo/a.ts', target: 'src/foo/b.ts' },
      { id: 'src/foo->src/bar.ts', source: 'src/foo', target: 'src/bar.ts' },
    ];
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/foo', 'src'],
      ['src/foo/a.ts', 'src/foo'],
      ['src/foo/b.ts', 'src/foo'],
      ['src/bar.ts', 'src'],
    ]);

    const levels = collectSiblingRoutingLevels(nodes, edges, parentByNode);

    expect(levels.map(level => level.folderId)).toEqual(['src/foo', 'src']);
    expect(levels[0]?.edges.map(edge => edge.id)).toEqual(['src/foo/a.ts->src/foo/b.ts']);
    expect(levels[0]?.nodes.map(node => node.id)).toEqual(['src/foo/a.ts', 'src/foo/b.ts']);
    expect(levels[1]?.edges.map(edge => edge.id)).toEqual(['src/foo->src/bar.ts']);
    expect(levels[1]?.nodes.map(node => node.id)).toEqual(['src/bar.ts', 'src/foo']);
  });

  it('omits cross-parent edges from every level', () => {
    const nodes = [
      makeNode('src', { type: 'folderGroup' }),
      makeNode('src/a.ts', { type: 'file', parentId: 'src' }),
      makeNode('lib', { type: 'folderGroup' }),
      makeNode('lib/b.ts', { type: 'file', parentId: 'lib' }),
    ];
    const edges: Edge[] = [{ id: 'src/a.ts->lib/b.ts', source: 'src/a.ts', target: 'lib/b.ts' }];
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/a.ts', 'src'],
      ['lib', null],
      ['lib/b.ts', 'lib'],
    ]);

    expect(collectSiblingRoutingLevels(nodes, edges, parentByNode)).toEqual([]);
  });

  it('skips levels that have children but no sibling edges', () => {
    const nodes = [
      makeNode('src', { type: 'folderGroup' }),
      makeNode('src/a.ts', { type: 'file', parentId: 'src' }),
      makeNode('src/b.ts', { type: 'file', parentId: 'src' }),
    ];
    const edges: Edge[] = [];
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/a.ts', 'src'],
      ['src/b.ts', 'src'],
    ]);

    expect(collectSiblingRoutingLevels(nodes, edges, parentByNode)).toEqual([]);
  });

  it('includes folderGroup among parent-level obstacles when a sibling edge uses it', () => {
    const nodes = [
      makeNode('src', { type: 'folderGroup' }),
      makeNode('src/foo', { type: 'folderGroup', parentId: 'src' }),
      makeNode('src/bar.ts', { type: 'file', parentId: 'src' }),
      makeNode('src/foo/nested.ts', { type: 'file', parentId: 'src/foo' }),
    ];
    const edges: Edge[] = [{ id: 'src/foo->src/bar.ts', source: 'src/foo', target: 'src/bar.ts' }];
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/foo', 'src'],
      ['src/bar.ts', 'src'],
      ['src/foo/nested.ts', 'src/foo'],
    ]);

    const levels = collectSiblingRoutingLevels(nodes, edges, parentByNode);

    expect(levels).toHaveLength(1);
    expect(levels[0]?.folderId).toBe('src');
    expect(levels[0]?.nodes.map(node => node.id)).toEqual(['src/bar.ts', 'src/foo']);
  });
});
