import { describe, expect, it } from 'vitest';

import type { VisibleTreeLayoutedNode } from '../../../types';
import { reflowDragPushDown } from './reflowDragPushDown';

function makeNode(
  path: string,
  position: { x: number; y: number },
  size: { width: number; height: number },
  children?: VisibleTreeLayoutedNode[],
): VisibleTreeLayoutedNode {
  return {
    path,
    ancestors: [],
    descendants: [],
    valueCircular: false,
    typeOnlyCircular: false,
    position,
    width: size.width,
    height: size.height,
    ...(children ? { children } : {}),
  };
}

describe('reflowDragPushDown', () => {
  it('pushes an overlapping sibling downward', () => {
    const parentByNode = new Map<string, string | null>([
      ['a', null],
      ['b', null],
    ]);
    const nodesByPath = new Map([
      ['a', makeNode('a', { x: 0, y: 0 }, { width: 100, height: 40 })],
      ['b', makeNode('b', { x: 0, y: 20 }, { width: 100, height: 40 })],
    ]);

    const next = reflowDragPushDown(nodesByPath, parentByNode, 'a', { x: 0, y: 0 });
    expect(next.get('b')!.position.y).toBeGreaterThanOrEqual(40);
  });

  it('grows a parent folder group when a child is pushed past the bound', () => {
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['a', 'src'],
      ['b', 'src'],
    ]);
    const nodesByPath = new Map([
      ['src', makeNode('src', { x: 0, y: 0 }, { width: 150, height: 100 }, [])],
      ['a', makeNode('a', { x: 16, y: 52 }, { width: 80, height: 32 })],
      ['b', makeNode('b', { x: 16, y: 60 }, { width: 80, height: 32 })],
    ]);

    const next = reflowDragPushDown(nodesByPath, parentByNode, 'a', { x: 16, y: 52 });
    expect(next.get('b')!.position.y).toBeGreaterThan(52);
    expect((next.get('src')!.height ?? 0) > 100).toBe(true);
  });

  it('cascades a > b > c without teleporting b under c', () => {
    const parentByNode = new Map<string, string | null>([
      ['a', null],
      ['b', null],
      ['c', null],
    ]);
    const nodesByPath = new Map([
      ['a', makeNode('a', { x: 0, y: 0 }, { width: 100, height: 100 })],
      ['b', makeNode('b', { x: 0, y: 40 }, { width: 100, height: 40 })],
      ['c', makeNode('c', { x: 0, y: 120 }, { width: 100, height: 40 })],
    ]);

    const next = reflowDragPushDown(nodesByPath, parentByNode, 'a', { x: 0, y: 0 });
    const a = next.get('a')!;
    const b = next.get('b')!;
    const c = next.get('c')!;

    expect(a.position.y).toBe(0);
    expect(b.position.y).toBeGreaterThanOrEqual(a.position.y + 100);
    expect(c.position.y).toBeGreaterThan(b.position.y);
    expect(b.position.y).toBeLessThan(c.position.y);
  });
});
