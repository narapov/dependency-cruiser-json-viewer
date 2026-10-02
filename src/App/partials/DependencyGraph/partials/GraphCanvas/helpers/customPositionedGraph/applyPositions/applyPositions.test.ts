import { describe, expect, it } from 'vitest';

import type { VisibleTreeLayoutedNode } from '../../../types';
import type { LayoutCache } from '../../layoutCache/types';
import { applyPositions } from './applyPositions';

function makeNode(path: string, position: { x: number; y: number }): VisibleTreeLayoutedNode {
  return {
    path,
    ancestors: [],
    descendants: [],
    valueCircular: false,
    typeOnlyCircular: false,
    position,
    width: 100,
    height: 40,
  };
}

describe('applyPositions', () => {
  it('keeps the dragged node fixed during settle', () => {
    const parentByNode = new Map<string, string | null>([
      ['a', null],
      ['b', null],
    ]);
    const nodesByPath = new Map([
      ['a', makeNode('a', { x: 0, y: 0 })],
      ['b', makeNode('b', { x: 0, y: 20 })],
    ]);

    const next = applyPositions(nodesByPath, parentByNode, new Map([['a', { path: 'a', position: { x: 0, y: 0 } }]]), {
      commitToCache: false,
    });

    expect(next.get('a')!.position).toEqual({ x: 0, y: 0 });
    expect(next.get('b')!.position.y).toBeGreaterThanOrEqual(40);
  });

  it('does not mutate the layout cache when commitToCache is false', () => {
    const cache: LayoutCache = new Map();
    const parentByNode = new Map<string, string | null>([['a', null]]);
    const nodesByPath = new Map([['a', makeNode('a', { x: 0, y: 0 })]]);

    applyPositions(nodesByPath, parentByNode, new Map([['a', { path: 'a', position: { x: 10, y: 10 } }]]), {
      commitToCache: false,
      cache,
    });

    expect(cache.size).toBe(0);
  });

  it('writes cache entries when commitToCache is true', () => {
    const cache: LayoutCache = new Map();
    const parentByNode = new Map<string, string | null>([['a', null]]);
    const nodesByPath = new Map([['a', makeNode('a', { x: 0, y: 0 })]]);

    applyPositions(nodesByPath, parentByNode, new Map([['a', { path: 'a', position: { x: 10, y: 10 } }]]), {
      commitToCache: true,
      cache,
    });

    expect(cache.get(null)?.children.get('a')?.position).toEqual({ x: 10, y: 10 });
  });
});
