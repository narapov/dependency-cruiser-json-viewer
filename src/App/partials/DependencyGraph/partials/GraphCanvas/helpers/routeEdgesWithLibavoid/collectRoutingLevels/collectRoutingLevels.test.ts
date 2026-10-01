import { describe, expect, it } from 'vitest';

import type { Edge, Node } from '@xyflow/react';

import { collectRoutingLevels, lowestCommonAncestor, overlapGroupParentId } from './collectRoutingLevels';

function makeNode(id: string, overrides: Partial<Node> = {}): Node {
  return {
    id,
    position: { x: 0, y: 0 },
    data: {},
    width: 100,
    height: 40,
    ...overrides,
  };
}

describe('lowestCommonAncestor', () => {
  it('returns the shared parent for sibling leaves', () => {
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/a.ts', 'src'],
      ['src/b.ts', 'src'],
    ]);

    expect(lowestCommonAncestor('src/a.ts', 'src/b.ts', parentByNode)).toBe('src');
  });

  it('returns null for root-level siblings', () => {
    const parentByNode = new Map<string, string | null>([
      ['a.ts', null],
      ['b.ts', null],
    ]);

    expect(lowestCommonAncestor('a.ts', 'b.ts', parentByNode)).toBeNull();
  });

  it('returns the folder that parents divergent subtrees', () => {
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/a', 'src'],
      ['src/b', 'src'],
      ['src/a/x.ts', 'src/a'],
      ['src/b/y.ts', 'src/b'],
    ]);

    expect(lowestCommonAncestor('src/a/x.ts', 'src/b/y.ts', parentByNode)).toBe('src');
  });

  it('keeps virtual root when the first argument is already null', () => {
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/a.ts', 'src'],
    ]);

    expect(lowestCommonAncestor(null, 'src/a.ts', parentByNode)).toBeNull();
  });
});

describe('overlapGroupParentId', () => {
  it('preserves virtual root when a cross-root endpoint is in the group', () => {
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/App', 'src'],
      ['src/foo.ts', 'src'],
      ['src/bar.ts', 'src'],
      ['node_modules', null],
    ]);
    const edgeById = new Map<string, Edge>([
      ['src/App->node_modules', { id: 'src/App->node_modules', source: 'src/App', target: 'node_modules' }],
      ['src/foo.ts->src/bar.ts', { id: 'src/foo.ts->src/bar.ts', source: 'src/foo.ts', target: 'src/bar.ts' }],
    ]);

    expect(
      overlapGroupParentId(['src/App->node_modules', 'src/foo.ts->src/bar.ts'], edgeById, parentByNode),
    ).toBeNull();
  });

  it('returns the shared folder when all endpoints stay under one parent', () => {
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/a.ts', 'src'],
      ['src/b.ts', 'src'],
      ['src/c.ts', 'src'],
    ]);
    const edgeById = new Map<string, Edge>([
      ['src/a.ts->src/b.ts', { id: 'src/a.ts->src/b.ts', source: 'src/a.ts', target: 'src/b.ts' }],
      ['src/b.ts->src/c.ts', { id: 'src/b.ts->src/c.ts', source: 'src/b.ts', target: 'src/c.ts' }],
    ]);

    expect(overlapGroupParentId(['src/a.ts->src/b.ts', 'src/b.ts->src/c.ts'], edgeById, parentByNode)).toBe('src');
  });
});

describe('collectRoutingLevels', () => {
  it('puts sibling leaf edges in leafEdges (п2)', () => {
    const nodes = [
      makeNode('src', { type: 'folderGroup' }),
      makeNode('src/a.ts', { type: 'file', parentId: 'src' }),
      makeNode('src/b.ts', { type: 'file', parentId: 'src' }),
    ];
    const edges: Edge[] = [{ id: 'src/a.ts->src/b.ts', source: 'src/a.ts', target: 'src/b.ts' }];
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/a.ts', 'src'],
      ['src/b.ts', 'src'],
    ]);

    const levels = collectRoutingLevels(nodes, edges, parentByNode);
    const srcLevel = levels.find(level => level.parentId === 'src');

    expect(srcLevel?.leafEdges.map(edge => edge.id)).toEqual(['src/a.ts->src/b.ts']);
    expect(srcLevel?.crossFolderEdges).toEqual([]);
  });

  it('puts deep cross-folder edges in crossFolderEdges at the LCA (п3)', () => {
    const nodes = [
      makeNode('src', { type: 'folderGroup' }),
      makeNode('src/a', { type: 'folderGroup', parentId: 'src' }),
      makeNode('src/b', { type: 'folderGroup', parentId: 'src' }),
      makeNode('src/a/x.ts', { type: 'file', parentId: 'src/a' }),
      makeNode('src/b/y.ts', { type: 'file', parentId: 'src/b' }),
    ];
    const edges: Edge[] = [{ id: 'src/a/x.ts->src/b/y.ts', source: 'src/a/x.ts', target: 'src/b/y.ts' }];
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/a', 'src'],
      ['src/b', 'src'],
      ['src/a/x.ts', 'src/a'],
      ['src/b/y.ts', 'src/b'],
    ]);

    const levels = collectRoutingLevels(nodes, edges, parentByNode);
    const srcLevel = levels.find(level => level.parentId === 'src');

    expect(srcLevel?.leafEdges).toEqual([]);
    expect(srcLevel?.crossFolderEdges.map(edge => edge.id)).toEqual(['src/a/x.ts->src/b/y.ts']);
  });

  it('puts cross-root edges on the virtual root, not the expanded folder level', () => {
    const nodes = [
      makeNode('src', { type: 'folderGroup' }),
      makeNode('src/App', { type: 'folder', parentId: 'src' }),
      makeNode('node_modules', { type: 'folder' }),
    ];
    const edges: Edge[] = [{ id: 'src/App->node_modules', source: 'src/App', target: 'node_modules' }];
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/App', 'src'],
      ['node_modules', null],
    ]);

    const levels = collectRoutingLevels(nodes, edges, parentByNode);
    const rootLevel = levels.find(level => level.parentId === null);
    const srcLevel = levels.find(level => level.parentId === 'src');

    expect(rootLevel?.crossFolderEdges.map(edge => edge.id)).toEqual(['src/App->node_modules']);
    expect(rootLevel?.leafEdges).toEqual([]);
    expect(srcLevel?.leafEdges).toEqual([]);
    expect(srcLevel?.crossFolderEdges).toEqual([]);
  });
});
