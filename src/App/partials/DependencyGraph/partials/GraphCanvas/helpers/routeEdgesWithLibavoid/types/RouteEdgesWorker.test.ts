import { describe, expect, it } from 'vitest';

import type { ThinRoutingEdge, VisibleTreeLayoutedNode } from '../../../types';
import { toRouteEdgesWorkerRequest } from './RouteEdgesWorker';

function layouted(
  overrides: Partial<VisibleTreeLayoutedNode> & Pick<VisibleTreeLayoutedNode, 'path'>,
): VisibleTreeLayoutedNode {
  return {
    ancestors: [],
    descendants: [],
    valueCircular: false,
    typeOnlyCircular: false,
    position: { x: 0, y: 0 },
    width: 40,
    height: 20,
    ...overrides,
  };
}

describe('toRouteEdgesWorkerRequest', () => {
  it('projects layouted tree to thin nodes and copies thin edges with ports', () => {
    const tree = [
      layouted({
        path: 'a.ts',
        position: { x: 1, y: 2 },
        width: 40,
        height: 20,
        valueCircular: true,
      }),
    ];
    const edges: ThinRoutingEdge[] = [
      {
        id: 'a->b',
        source: 'a.ts',
        target: 'b.ts',
        sourcePort: { side: 'east', index: 0, y: 10 },
        targetPort: { side: 'west', index: 0, y: 10 },
      },
    ];

    const request = toRouteEdgesWorkerRequest({ tree, edges });

    expect(request.tree).toEqual([
      {
        path: 'a.ts',
        ancestors: [],
        descendants: [],
        position: { x: 1, y: 2 },
        width: 40,
        height: 20,
      },
    ]);
    expect(request.tree[0]).not.toHaveProperty('valueCircular');
    expect(request.edges).toEqual(edges);
    expect(request).not.toHaveProperty('parentByNode');
    expect(request).not.toHaveProperty('nodes');
  });

  it('applies live geometry overlay in the same projection walk', () => {
    const tree = [layouted({ path: 'a.ts', position: { x: 0, y: 0 }, width: 40, height: 20 })];
    const geometryByPath = new Map([['a.ts', { position: { x: 15, y: 25 }, width: 40, height: 20 }]]);

    const request = toRouteEdgesWorkerRequest({ tree, edges: [], geometryByPath });

    expect(request.tree[0]?.position).toEqual({ x: 15, y: 25 });
  });
});
