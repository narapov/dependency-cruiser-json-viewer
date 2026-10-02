import { describe, expect, it } from 'vitest';

import type { VisibleTreeLayoutedNode } from '../../../types';
import { GROUP_HEADER, GROUP_PADDING } from '../../buildGraph';
import type { LayoutCache } from '../../layoutCache/types';
import { buildAncestryIndex } from '../buildAncestryIndex';
import { applyPositions } from './applyPositions';

const ORIGIN_X = GROUP_PADDING;
const ORIGIN_Y = GROUP_HEADER + GROUP_PADDING;

function makeNode(
  path: string,
  position: { x: number; y: number },
  size: { width: number; height: number } = { width: 100, height: 40 },
  options: { ancestors?: string[]; children?: VisibleTreeLayoutedNode[] } = {},
): VisibleTreeLayoutedNode {
  return {
    path,
    ancestors: options.ancestors ?? [],
    descendants: [],
    valueCircular: false,
    typeOnlyCircular: false,
    position,
    width: size.width,
    height: size.height,
    ...(options.children ? { children: options.children } : {}),
  };
}

describe('applyPositions', () => {
  it('keeps the dragged node fixed during settle', () => {
    const nodesByPath = new Map([
      ['a', makeNode('a', { x: 0, y: 0 })],
      ['b', makeNode('b', { x: 0, y: 20 })],
    ]);
    const { childrenByParent } = buildAncestryIndex(nodesByPath);

    const next = applyPositions(
      nodesByPath,
      childrenByParent,
      new Map([['a', { path: 'a', position: { x: 0, y: 0 } }]]),
      { commitToCache: false },
    );

    expect(next.get('a')!.position).toEqual({ x: 0, y: 0 });
    expect(next.get('b')!.position.y).toBeGreaterThanOrEqual(40);
  });

  it('does not mutate the layout cache when commitToCache is false', () => {
    const cache: LayoutCache = new Map();
    const nodesByPath = new Map([['a', makeNode('a', { x: 0, y: 0 })]]);
    const { childrenByParent } = buildAncestryIndex(nodesByPath);

    applyPositions(nodesByPath, childrenByParent, new Map([['a', { path: 'a', position: { x: 10, y: 10 } }]]), {
      commitToCache: false,
      cache,
    });

    expect(cache.size).toBe(0);
  });

  it('writes cache entries when commitToCache is true', () => {
    const cache: LayoutCache = new Map();
    const nodesByPath = new Map([['a', makeNode('a', { x: 0, y: 0 })]]);
    const { childrenByParent } = buildAncestryIndex(nodesByPath);

    applyPositions(nodesByPath, childrenByParent, new Map([['a', { path: 'a', position: { x: 10, y: 10 } }]]), {
      commitToCache: true,
      cache,
    });

    expect(cache.get(null)?.children.get('a')?.position).toEqual({ x: 10, y: 10 });
  });

  it('persists left-normalize child and group geometry into the cache', () => {
    const cache: LayoutCache = new Map();
    const nodesByPath = new Map([
      ['src', makeNode('src', { x: 100, y: 40 }, { width: 200, height: 120 }, { children: [] })],
      ['a', makeNode('a', { x: ORIGIN_X, y: ORIGIN_Y }, { width: 80, height: 32 }, { ancestors: ['src'] })],
      ['b', makeNode('b', { x: 120, y: ORIGIN_Y }, { width: 80, height: 32 }, { ancestors: ['src'] })],
    ]);
    const { childrenByParent } = buildAncestryIndex(nodesByPath);

    const next = applyPositions(
      nodesByPath,
      childrenByParent,
      new Map([['a', { path: 'a', position: { x: -40, y: ORIGIN_Y } }]]),
      { commitToCache: true, cache },
    );

    expect(next.get('a')!.position.x).toBe(ORIGIN_X);
    expect(cache.get('src')?.children.get('a')?.position.x).toBe(ORIGIN_X);
    expect(cache.get('src')?.children.get('b')?.position.x).toBe(next.get('b')!.position.x);
    expect(cache.get('src')?.width).toBe(next.get('src')!.width);
    expect(cache.get('src')?.height).toBe(next.get('src')!.height);
    expect(cache.get(null)?.children.get('src')?.position).toEqual(next.get('src')!.position);
  });
});
