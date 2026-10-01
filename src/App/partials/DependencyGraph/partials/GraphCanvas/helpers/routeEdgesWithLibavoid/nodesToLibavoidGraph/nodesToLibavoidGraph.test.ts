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
  it('nests folderGroup children and attaches EAST/WEST ports on root edges', () => {
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

    expect(graph.children.map(child => child.id)).toEqual(['src']);
    expect(graph.children[0]?.children?.map(child => child.id)).toEqual(['src/a.ts', 'src/b.ts']);
    expect(graph.edges).toEqual([
      {
        id: 'src/a.ts->src/b.ts',
        source: 'src/a.ts',
        target: 'src/b.ts',
        sourcePort: 'src/a.ts:E0',
        targetPort: 'src/b.ts:W0',
      },
    ]);

    const source = graph.children[0]?.children?.find(child => child.id === 'src/a.ts');
    const target = graph.children[0]?.children?.find(child => child.id === 'src/b.ts');
    expect(source?.ports).toEqual([{ id: 'src/a.ts:E0', x: 100, y: 20, width: 1, height: 1 }]);
    expect(target?.ports).toEqual([{ id: 'src/b.ts:W0', x: 0, y: 20, width: 1, height: 1 }]);
    expect(source?.x).toBe(20);
    expect(source?.y).toBe(40);
  });

  it('puts cross-parent edges on the root with ports on deep endpoints', () => {
    const nodes = [
      makeNode('src', { type: 'folderGroup', position: { x: 0, y: 0 }, width: 300, height: 200 }),
      makeNode('src/a.ts', { type: 'file', position: { x: 10, y: 40 }, parentId: 'src' }),
      makeNode('lib', { type: 'folderGroup', position: { x: 400, y: 0 }, width: 300, height: 200 }),
      makeNode('lib/b.ts', { type: 'file', position: { x: 10, y: 40 }, parentId: 'lib' }),
    ];
    const edges: Edge[] = [{ id: 'src/a.ts->lib/b.ts', source: 'src/a.ts', target: 'lib/b.ts' }];
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/a.ts', 'src'],
      ['lib', null],
      ['lib/b.ts', 'lib'],
    ]);

    const graph = nodesToLibavoidGraph(nodes, edges, parentByNode);

    expect(graph.children.map(child => child.id)).toEqual(['lib', 'src']);
    expect(graph.edges).toEqual([
      {
        id: 'src/a.ts->lib/b.ts',
        source: 'src/a.ts',
        target: 'lib/b.ts',
        sourcePort: 'src/a.ts:E0',
        targetPort: 'lib/b.ts:W0',
      },
    ]);
  });

  it('collapses folderGroups with no edge endpoints to opaque boxes', () => {
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
        id: 'src',
        x: 10,
        y: 20,
        width: 400,
        height: 200,
      },
    ]);
  });

  it('keeps relative coordinates along the endpoint ancestry and collapses sibling folders', () => {
    const nodes = [
      makeNode('src', { type: 'folderGroup', position: { x: 0, y: 0 }, width: 800, height: 400 }),
      makeNode('src/keep', {
        type: 'folderGroup',
        position: { x: 10, y: 40 },
        width: 300,
        height: 200,
        parentId: 'src',
      }),
      makeNode('src/keep/a.ts', { type: 'file', position: { x: 5, y: 8 }, parentId: 'src/keep' }),
      makeNode('src/drop', {
        type: 'folderGroup',
        position: { x: 400, y: 40 },
        width: 300,
        height: 200,
        parentId: 'src',
      }),
      makeNode('src/drop/noise.ts', { type: 'file', position: { x: 5, y: 8 }, parentId: 'src/drop' }),
      makeNode('src/sibling.ts', { type: 'file', position: { x: 10, y: 300 }, parentId: 'src' }),
    ];
    const edges: Edge[] = [{ id: 'src/keep/a.ts->src/sibling.ts', source: 'src/keep/a.ts', target: 'src/sibling.ts' }];
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['src/keep', 'src'],
      ['src/keep/a.ts', 'src/keep'],
      ['src/drop', 'src'],
      ['src/drop/noise.ts', 'src/drop'],
      ['src/sibling.ts', 'src'],
    ]);

    const graph = nodesToLibavoidGraph(nodes, edges, parentByNode);
    const src = graph.children.find(child => child.id === 'src');
    const childIds = src?.children?.map(child => child.id).toSorted();

    expect(childIds).toEqual(['src/drop', 'src/keep', 'src/sibling.ts']);
    expect(src?.children?.find(child => child.id === 'src/drop')?.children).toBeUndefined();
    expect(src?.children?.find(child => child.id === 'src/keep')?.children?.map(child => child.id)).toEqual([
      'src/keep/a.ts',
    ]);
    expect(src?.children?.find(child => child.id === 'src/keep')?.children?.[0]).toMatchObject({
      id: 'src/keep/a.ts',
      x: 5,
      y: 8,
    });
  });

  it('drops edges whose endpoints are not in the node set', () => {
    const nodes = [makeNode('a.ts', { type: 'file' })];
    const edges: Edge[] = [{ id: 'a.ts->missing', source: 'a.ts', target: 'missing' }];

    const graph = nodesToLibavoidGraph(nodes, edges, new Map([['a.ts', null]]));

    expect(graph.edges).toEqual([]);
    expect(graph.children[0]?.ports).toBeUndefined();
  });

  it('orders EAST ports by target absolute center Y, not edge array order', () => {
    const nodes = [
      makeNode('a.ts', { type: 'file', height: 60 }),
      makeNode('b.ts', { type: 'file', position: { x: 200, y: 100 } }),
      makeNode('c.ts', { type: 'file', position: { x: 200, y: 0 } }),
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
    const edgeById = new Map(graph.edges.map(edge => [edge.id, edge]));

    expect(source?.ports).toEqual([
      { id: 'a.ts:E0', x: 100, y: 20, width: 1, height: 1 },
      { id: 'a.ts:E1', x: 100, y: 40, width: 1, height: 1 },
    ]);
    expect(edgeById.get('a.ts->c.ts')?.sourcePort).toBe('a.ts:E0');
    expect(edgeById.get('a.ts->b.ts')?.sourcePort).toBe('a.ts:E1');
  });

  it('orders WEST ports by source absolute center Y even when edges are listed bottom-first', () => {
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
