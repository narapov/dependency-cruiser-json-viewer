import { describe, expect, it } from 'vitest';

import type { Edge, Node } from '@xyflow/react';

import { nodesToLibavoidGraph } from './nodesToLibavoidGraph';

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

describe('nodesToLibavoidGraph', () => {
  it('omits folderGroup nodes and attaches EAST/WEST ports on edges', () => {
    const nodes = [
      makeNode('src', { type: 'folderGroup', position: { x: 0, y: 0 }, width: 400, height: 200 }),
      makeNode('src/a.ts', { type: 'file', position: { x: 20, y: 40 }, parentId: 'src' }),
      makeNode('src/b.ts', { type: 'file', position: { x: 200, y: 40 }, parentId: 'src' }),
    ];
    const edges: Edge[] = [{ id: 'src/a.ts->src/b.ts', source: 'src/a.ts', target: 'src/b.ts' }];
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/a.ts', 'src'],
      ['src/b.ts', 'src'],
    ]);

    const graph = nodesToLibavoidGraph(nodes, edges, parentByNode);

    expect(graph.children.map(child => child.id)).toEqual(['src/a.ts', 'src/b.ts']);
    expect(graph.edges).toEqual([
      {
        id: 'src/a.ts->src/b.ts',
        source: 'src/a.ts',
        target: 'src/b.ts',
        sourcePort: 'src/a.ts:E0',
        targetPort: 'src/b.ts:W0',
      },
    ]);

    const source = graph.children.find(child => child.id === 'src/a.ts');
    const target = graph.children.find(child => child.id === 'src/b.ts');
    expect(source?.ports).toEqual([{ id: 'src/a.ts:E0', x: 100, y: 20, width: 1, height: 1 }]);
    expect(target?.ports).toEqual([{ id: 'src/b.ts:W0', x: 0, y: 20, width: 1, height: 1 }]);
  });

  it('uses absolute coordinates from the parent chain', () => {
    const nodes = [
      makeNode('src', { type: 'folderGroup', position: { x: 10, y: 20 }, width: 400, height: 200 }),
      makeNode('src/a.ts', { type: 'file', position: { x: 5, y: 8 }, parentId: 'src' }),
    ];
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/a.ts', 'src'],
    ]);

    const graph = nodesToLibavoidGraph(nodes, [], parentByNode);

    expect(graph.children).toEqual([
      {
        id: 'src/a.ts',
        x: 15,
        y: 28,
        width: 100,
        height: 40,
      },
    ]);
  });

  it('drops edges whose endpoints are not obstacles', () => {
    const nodes = [makeNode('a.ts', { type: 'file' })];
    const edges: Edge[] = [{ id: 'a.ts->missing', source: 'a.ts', target: 'missing' }];

    const graph = nodesToLibavoidGraph(nodes, edges, new Map([['a.ts', null]]));

    expect(graph.edges).toEqual([]);
    expect(graph.children[0]?.ports).toBeUndefined();
  });

  it('spreads multiple EAST ports along the source height', () => {
    const nodes = [
      makeNode('a.ts', { type: 'file', height: 60 }),
      makeNode('b.ts', { type: 'file' }),
      makeNode('c.ts', { type: 'file' }),
    ];
    const edges: Edge[] = [
      { id: 'a.ts->b.ts', source: 'a.ts', target: 'b.ts' },
      { id: 'a.ts->c.ts', source: 'a.ts', target: 'c.ts' },
    ];
    const parentByNode = new Map<string, string | null>([
      ['a.ts', null],
      ['b.ts', null],
      ['c.ts', null],
    ]);

    const graph = nodesToLibavoidGraph(nodes, edges, parentByNode);
    const source = graph.children.find(child => child.id === 'a.ts');

    expect(source?.ports).toEqual([
      { id: 'a.ts:E0', x: 100, y: 20, width: 1, height: 1 },
      { id: 'a.ts:E1', x: 100, y: 40, width: 1, height: 1 },
    ]);
    expect(graph.edges.map(edge => edge.sourcePort)).toEqual(['a.ts:E0', 'a.ts:E1']);
  });
});
