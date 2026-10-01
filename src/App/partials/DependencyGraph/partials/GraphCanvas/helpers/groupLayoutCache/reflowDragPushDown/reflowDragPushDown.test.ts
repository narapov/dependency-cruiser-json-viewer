import { describe, expect, it } from 'vitest';

import type { Node } from '@xyflow/react';

import { reflowDragPushDown } from './reflowDragPushDown';

function makeNode(
  id: string,
  position: { x: number; y: number },
  size: { width: number; height: number },
  parentId?: string,
): Node {
  return {
    id,
    type: 'file',
    position,
    width: size.width,
    height: size.height,
    data: {},
    parentId,
  };
}

describe('reflowDragPushDown', () => {
  it('pushes an overlapping sibling downward', () => {
    const parentByNode = new Map<string, string | null>([
      ['a', null],
      ['b', null],
    ]);
    const nodes = [
      makeNode('a', { x: 0, y: 0 }, { width: 100, height: 40 }),
      makeNode('b', { x: 0, y: 20 }, { width: 100, height: 40 }),
    ];

    const next = reflowDragPushDown(nodes, parentByNode, 'a', { x: 0, y: 0 });
    const b = next.find(node => node.id === 'b')!;
    expect(b.position.y).toBeGreaterThanOrEqual(40);
  });

  it('grows a parent folder group when a child is pushed past the bound', () => {
    const parentByNode = new Map<string, string | null>([
      ['src', null],
      ['a', 'src'],
      ['b', 'src'],
    ]);
    const nodes: Node[] = [
      {
        id: 'src',
        type: 'folderGroup',
        position: { x: 0, y: 0 },
        width: 150,
        height: 100,
        data: {},
        style: { width: 150, height: 100 },
      },
      makeNode('a', { x: 16, y: 52 }, { width: 80, height: 32 }, 'src'),
      makeNode('b', { x: 16, y: 60 }, { width: 80, height: 32 }, 'src'),
    ];

    const next = reflowDragPushDown(nodes, parentByNode, 'a', { x: 16, y: 52 });
    const group = next.find(node => node.id === 'src')!;
    const b = next.find(node => node.id === 'b')!;
    expect(b.position.y).toBeGreaterThan(52);
    expect((group.height ?? 0) > 100 || (group.style?.height as number) > 100).toBe(true);
  });

  it('cascades a > b > c without teleporting b under c', () => {
    const parentByNode = new Map<string, string | null>([
      ['a', null],
      ['b', null],
      ['c', null],
    ]);
    const nodes = [
      makeNode('a', { x: 0, y: 0 }, { width: 100, height: 100 }),
      makeNode('b', { x: 0, y: 40 }, { width: 100, height: 40 }),
      makeNode('c', { x: 0, y: 120 }, { width: 100, height: 40 }),
    ];

    const next = reflowDragPushDown(nodes, parentByNode, 'a', { x: 0, y: 0 });
    const a = next.find(node => node.id === 'a')!;
    const b = next.find(node => node.id === 'b')!;
    const c = next.find(node => node.id === 'c')!;

    expect(a.position.y).toBe(0);
    expect(b.position.y).toBeGreaterThanOrEqual(a.position.y + 100);
    expect(c.position.y).toBeGreaterThan(b.position.y);
    expect(b.position.y).toBeLessThan(c.position.y);
  });
});
