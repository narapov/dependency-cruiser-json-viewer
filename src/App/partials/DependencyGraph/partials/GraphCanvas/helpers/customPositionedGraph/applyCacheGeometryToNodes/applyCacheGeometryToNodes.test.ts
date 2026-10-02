import { describe, expect, it } from 'vitest';

import type { VisibleTreeLayoutedNode } from '../../../types';
import type { LayoutCache } from '../../layoutCache/types';
import { buildParentByNode } from '../buildParentByNode';
import { applyCacheGeometryToNodes } from './applyCacheGeometryToNodes';

function makeNode(path: string, position: { x: number; y: number }): VisibleTreeLayoutedNode {
  return {
    path,
    ancestors: [],
    descendants: [],
    valueCircular: false,
    typeOnlyCircular: false,
    position,
    width: 120,
    height: 32,
  };
}

describe('applyCacheGeometryToNodes', () => {
  it('overlays cached child positions and sizes onto layouted nodes', () => {
    const roots = [makeNode('a.ts', { x: 0, y: 0 }), makeNode('b.ts', { x: 0, y: 40 })];
    const nodes = new Map(roots.map(node => [node.path, node]));
    const parentByNode = buildParentByNode(roots);
    const cache: LayoutCache = new Map([
      [
        null,
        {
          id: null,
          width: 200,
          height: 100,
          children: new Map([
            ['a.ts', { id: 'a.ts', position: { x: 11, y: 22 }, width: 120, height: 32 }],
            ['b.ts', { id: 'b.ts', position: { x: 0, y: 80 }, width: 120, height: 32 }],
          ]),
        },
      ],
    ]);

    const next = applyCacheGeometryToNodes(nodes, cache, parentByNode);
    expect(next.get('a.ts')?.position).toEqual({ x: 11, y: 22 });
    expect(next.get('b.ts')?.position).toEqual({ x: 0, y: 80 });
  });
});
