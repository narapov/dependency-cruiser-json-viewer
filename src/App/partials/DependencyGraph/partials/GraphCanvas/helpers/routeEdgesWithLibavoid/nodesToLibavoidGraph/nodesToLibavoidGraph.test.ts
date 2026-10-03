import { describe, expect, it } from 'vitest';

import { indexTreeByKey } from '@/domain';

import type { ThinRoutingEdge, VisibleTreeLayoutedNode } from '../../../types';
import { toRouteEdgesWorkerRequest } from '../types';
import { nodesToLibavoidGraph } from './nodesToLibavoidGraph';

function fileNode(path: string, overrides: Partial<VisibleTreeLayoutedNode> = {}): VisibleTreeLayoutedNode {
  return {
    path,
    ancestors: [],
    descendants: [],
    position: { x: 0, y: 0 },
    width: 100,
    height: 40,
    valueCircular: false,
    typeOnlyCircular: false,
    ...overrides,
  };
}

function folderNode(
  path: string,
  children: VisibleTreeLayoutedNode[],
  ancestors: string[] = [],
  overrides: Partial<VisibleTreeLayoutedNode> = {},
): VisibleTreeLayoutedNode {
  const childAncestors = [path, ...ancestors];
  const kids = children.map(child => ({ ...child, ancestors: childAncestors }));
  const descendants = kids.flatMap(child => [child.path, ...child.descendants]);

  return {
    path,
    ancestors,
    descendants,
    children: kids,
    position: { x: 0, y: 0 },
    width: 400,
    height: 200,
    valueCircular: false,
    typeOnlyCircular: false,
    ...overrides,
  };
}

function mapFromRoots(roots: VisibleTreeLayoutedNode[]) {
  return indexTreeByKey(toRouteEdgesWorkerRequest({ tree: roots, edges: [] }).tree, node => node.path);
}

describe('nodesToLibavoidGraph', () => {
  it('nests folder children and attaches EAST/WEST ports on root edges', () => {
    const nodeByPath = mapFromRoots([
      folderNode('src', [
        fileNode('src/a.ts', { position: { x: 20, y: 40 } }),
        fileNode('src/b.ts', { position: { x: 200, y: 40 } }),
      ]),
    ]);
    const edges: ThinRoutingEdge[] = [{ id: 'src/a.ts->src/b.ts', source: 'src/a.ts', target: 'src/b.ts' }];

    const graph = nodesToLibavoidGraph(nodeByPath, edges);

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
    const nodeByPath = mapFromRoots([
      folderNode('src', [fileNode('src/a.ts', { position: { x: 10, y: 40 } })], [], {
        position: { x: 0, y: 0 },
        width: 300,
        height: 200,
      }),
      folderNode('lib', [fileNode('lib/b.ts', { position: { x: 10, y: 40 } })], [], {
        position: { x: 400, y: 0 },
        width: 300,
        height: 200,
      }),
    ]);
    const edges: ThinRoutingEdge[] = [{ id: 'src/a.ts->lib/b.ts', source: 'src/a.ts', target: 'lib/b.ts' }];

    const graph = nodesToLibavoidGraph(nodeByPath, edges);

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

  it('collapses folders with no edge endpoints to opaque boxes', () => {
    const nodeByPath = mapFromRoots([
      folderNode('src', [fileNode('src/a.ts', { position: { x: 5, y: 8 } })], [], {
        position: { x: 10, y: 20 },
      }),
    ]);

    const graph = nodesToLibavoidGraph(nodeByPath, []);

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
    const nodeByPath = mapFromRoots([
      folderNode(
        'src',
        [
          folderNode('src/keep', [fileNode('src/keep/a.ts', { position: { x: 5, y: 8 } })], ['src'], {
            position: { x: 10, y: 40 },
            width: 300,
            height: 200,
          }),
          folderNode('src/drop', [fileNode('src/drop/noise.ts', { position: { x: 5, y: 8 } })], ['src'], {
            position: { x: 400, y: 40 },
            width: 300,
            height: 200,
          }),
          fileNode('src/sibling.ts', { position: { x: 10, y: 300 }, ancestors: ['src'] }),
        ],
        [],
        { width: 800, height: 400 },
      ),
    ]);
    const edges: ThinRoutingEdge[] = [
      { id: 'src/keep/a.ts->src/sibling.ts', source: 'src/keep/a.ts', target: 'src/sibling.ts' },
    ];

    const graph = nodesToLibavoidGraph(nodeByPath, edges);
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
    const nodeByPath = mapFromRoots([fileNode('a.ts')]);
    const edges: ThinRoutingEdge[] = [{ id: 'a.ts->missing', source: 'a.ts', target: 'missing' }];

    const graph = nodesToLibavoidGraph(nodeByPath, edges);

    expect(graph.edges).toEqual([]);
    expect(graph.children[0]?.ports).toBeUndefined();
  });

  it('orders EAST ports by target absolute center Y, not edge array order', () => {
    const nodeByPath = mapFromRoots([
      fileNode('a.ts', { height: 60 }),
      fileNode('b.ts', { position: { x: 200, y: 100 } }),
      fileNode('c.ts', { position: { x: 200, y: 0 } }),
    ]);
    const edges: ThinRoutingEdge[] = [
      { id: 'a.ts->b.ts', source: 'a.ts', target: 'b.ts' },
      { id: 'a.ts->c.ts', source: 'a.ts', target: 'c.ts' },
    ];

    const graph = nodesToLibavoidGraph(nodeByPath, edges);
    const source = graph.children.find(child => child.id === 'a.ts');
    const edgeById = new Map(graph.edges.map(edge => [edge.id, edge]));

    expect(source?.ports).toEqual([
      { id: 'a.ts:E0', x: 100, y: 20, width: 1, height: 1 },
      { id: 'a.ts:E1', x: 100, y: 40, width: 1, height: 1 },
    ]);
    expect(edgeById.get('a.ts->c.ts')?.sourcePort).toBe('a.ts:E0');
    expect(edgeById.get('a.ts->b.ts')?.sourcePort).toBe('a.ts:E1');
  });

  it('reuses frozen thin-edge ports without re-ordering against the map', () => {
    const nodeByPath = mapFromRoots([
      fileNode('a.ts', { height: 60 }),
      fileNode('b.ts', { position: { x: 200, y: 0 } }),
      fileNode('c.ts', { position: { x: 200, y: 100 } }),
    ]);
    const edges: ThinRoutingEdge[] = [
      {
        id: 'a.ts->b.ts',
        source: 'a.ts',
        target: 'b.ts',
        sourcePort: { side: 'east', index: 1, y: 40 },
        targetPort: { side: 'west', index: 0, y: 20 },
      },
      {
        id: 'a.ts->c.ts',
        source: 'a.ts',
        target: 'c.ts',
        sourcePort: { side: 'east', index: 0, y: 20 },
        targetPort: { side: 'west', index: 0, y: 20 },
      },
    ];

    const graph = nodesToLibavoidGraph(nodeByPath, edges);
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
    const nodeByPath = mapFromRoots([
      fileNode('test.ts', { position: { x: 0, y: 0 } }),
      fileNode('index.ts', { position: { x: 0, y: 80 } }),
      fileNode('impl.ts', { position: { x: 200, y: 40 } }),
    ]);
    const edges: ThinRoutingEdge[] = [
      { id: 'index.ts->impl.ts', source: 'index.ts', target: 'impl.ts' },
      { id: 'test.ts->impl.ts', source: 'test.ts', target: 'impl.ts' },
    ];

    const graph = nodesToLibavoidGraph(nodeByPath, edges);
    const target = graph.children.find(child => child.id === 'impl.ts');
    const edgeById = new Map(graph.edges.map(edge => [edge.id, edge]));

    expect(target?.ports?.map(port => port.id)).toEqual(['impl.ts:W0', 'impl.ts:W1']);
    expect(target?.ports?.[0]?.y).toBeLessThan(target?.ports?.[1]?.y ?? Infinity);
    expect(edgeById.get('test.ts->impl.ts')?.targetPort).toBe('impl.ts:W0');
    expect(edgeById.get('index.ts->impl.ts')?.targetPort).toBe('impl.ts:W1');
  });
});
