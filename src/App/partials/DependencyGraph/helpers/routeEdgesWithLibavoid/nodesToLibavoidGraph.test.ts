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
  it('includes folderGroup obstacles and attaches EAST/WEST ports on edges', () => {
    const allNodes = [
      makeNode('src', { type: 'folderGroup', position: { x: 0, y: 0 }, width: 400, height: 200 }),
      makeNode('src/a.ts', { type: 'file', position: { x: 20, y: 40 }, parentId: 'src' }),
      makeNode('src/b.ts', { type: 'file', position: { x: 200, y: 40 }, parentId: 'src' }),
    ];
    const levelNodes = [
      makeNode('src/a.ts', { type: 'file', position: { x: 20, y: 40 }, parentId: 'src' }),
      makeNode('src/b.ts', { type: 'file', position: { x: 200, y: 40 }, parentId: 'src' }),
    ];
    const edges: Edge[] = [{ id: 'src/a.ts->src/b.ts', source: 'src/a.ts', target: 'src/b.ts' }];
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/a.ts', 'src'],
      ['src/b.ts', 'src'],
    ]);

    const graph = nodesToLibavoidGraph(levelNodes, edges, parentByNode, allNodes);

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

  it('keeps folderGroup as a sibling obstacle when present on the level', () => {
    const allNodes = [
      makeNode('src', { type: 'folderGroup', position: { x: 0, y: 0 }, width: 500, height: 300 }),
      makeNode('src/foo', {
        type: 'folderGroup',
        position: { x: 10, y: 20 },
        width: 200,
        height: 100,
        parentId: 'src',
      }),
      makeNode('src/bar.ts', { type: 'file', position: { x: 250, y: 30 }, parentId: 'src' }),
    ];
    const levelNodes = [
      makeNode('src/foo', {
        type: 'folderGroup',
        position: { x: 10, y: 20 },
        width: 200,
        height: 100,
        parentId: 'src',
      }),
      makeNode('src/bar.ts', { type: 'file', position: { x: 250, y: 30 }, parentId: 'src' }),
    ];
    const edges: Edge[] = [{ id: 'src/foo->src/bar.ts', source: 'src/foo', target: 'src/bar.ts' }];
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/foo', 'src'],
      ['src/bar.ts', 'src'],
    ]);

    const graph = nodesToLibavoidGraph(levelNodes, edges, parentByNode, allNodes);

    expect(graph.children.map(child => child.id)).toEqual(['src/foo', 'src/bar.ts']);
    expect(graph.children.find(child => child.id === 'src/foo')).toMatchObject({
      x: 10,
      y: 20,
      width: 200,
      height: 100,
    });
  });

  it('uses absolute coordinates from the parent chain via allNodes', () => {
    const allNodes = [
      makeNode('src', { type: 'folderGroup', position: { x: 10, y: 20 }, width: 400, height: 200 }),
      makeNode('src/a.ts', { type: 'file', position: { x: 5, y: 8 }, parentId: 'src' }),
    ];
    const levelNodes = [makeNode('src/a.ts', { type: 'file', position: { x: 5, y: 8 }, parentId: 'src' })];
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/a.ts', 'src'],
    ]);

    const graph = nodesToLibavoidGraph(levelNodes, [], parentByNode, allNodes);

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

  it('orders EAST ports by target center Y, not edge array order', () => {
    const nodes = [
      makeNode('a.ts', { type: 'file', height: 60 }),
      makeNode('b.ts', { type: 'file', position: { x: 200, y: 100 } }),
      makeNode('c.ts', { type: 'file', position: { x: 200, y: 0 } }),
    ];
    // Lower target listed first so array order would prefer b → E0 without Y sorting.
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
    const edgeById = new Map(graph.edges.map(edge => [edge.id, edge]));

    expect(source?.ports).toEqual([
      { id: 'a.ts:E0', x: 100, y: 20, width: 1, height: 1 },
      { id: 'a.ts:E1', x: 100, y: 40, width: 1, height: 1 },
    ]);
    expect(edgeById.get('a.ts->c.ts')?.sourcePort).toBe('a.ts:E0');
    expect(edgeById.get('a.ts->b.ts')?.sourcePort).toBe('a.ts:E1');
  });

  it('orders WEST ports by source center Y even when edges are listed bottom-first', () => {
    const nodes = [
      makeNode('test.ts', { type: 'file', position: { x: 0, y: 0 } }),
      makeNode('index.ts', { type: 'file', position: { x: 0, y: 80 } }),
      makeNode('impl.ts', { type: 'file', position: { x: 200, y: 40 } }),
    ];
    const edges: Edge[] = [
      { id: 'index.ts->impl.ts', source: 'index.ts', target: 'impl.ts' },
      { id: 'test.ts->impl.ts', source: 'test.ts', target: 'impl.ts' },
    ];
    const parentByNode = new Map<string, string | null>([
      ['test.ts', null],
      ['index.ts', null],
      ['impl.ts', null],
    ]);

    const graph = nodesToLibavoidGraph(nodes, edges, parentByNode);
    const target = graph.children.find(child => child.id === 'impl.ts');
    const edgeById = new Map(graph.edges.map(edge => [edge.id, edge]));

    expect(target?.ports?.map(port => port.id)).toEqual(['impl.ts:W0', 'impl.ts:W1']);
    expect(target?.ports?.[0]?.y).toBeLessThan(target?.ports?.[1]?.y ?? Infinity);
    expect(edgeById.get('test.ts->impl.ts')?.targetPort).toBe('impl.ts:W0');
    expect(edgeById.get('index.ts->impl.ts')?.targetPort).toBe('impl.ts:W1');
  });
});
