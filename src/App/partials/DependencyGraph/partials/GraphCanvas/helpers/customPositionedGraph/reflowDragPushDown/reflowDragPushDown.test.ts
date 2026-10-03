import { describe, expect, it } from 'vitest';

import type { VisibleTreeLayoutedNode } from '../../../types';
import { GROUP_HEADER, GROUP_PADDING } from '../../buildGraph';
import { buildAncestryIndex } from '../buildAncestryIndex';
import { reflowDragPushDown } from './reflowDragPushDown';

const ORIGIN_X = GROUP_PADDING;
const ORIGIN_Y = GROUP_HEADER + GROUP_PADDING;

function makeNode(
  path: string,
  position: { x: number; y: number },
  size: { width: number; height: number },
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

function reflow(
  nodesByPath: Map<string, VisibleTreeLayoutedNode>,
  draggedNodeId: string,
  draggedPosition: { x: number; y: number },
) {
  const { childrenByParent } = buildAncestryIndex(nodesByPath);
  return reflowDragPushDown(nodesByPath, childrenByParent, draggedNodeId, draggedPosition);
}

describe('reflowDragPushDown', () => {
  it('pushes an overlapping sibling downward', () => {
    const nodesByPath = new Map([
      ['a', makeNode('a', { x: 0, y: 0 }, { width: 100, height: 40 })],
      ['b', makeNode('b', { x: 0, y: 20 }, { width: 100, height: 40 })],
    ]);

    const next = reflow(nodesByPath, 'a', { x: 0, y: 0 });
    expect(next.get('b')!.position.y).toBeGreaterThanOrEqual(40);
  });

  it('grows a parent folder group when a child is pushed past the bound', () => {
    const nodesByPath = new Map([
      ['src', makeNode('src', { x: 0, y: 0 }, { width: 150, height: 100 }, { children: [] })],
      ['a', makeNode('a', { x: 16, y: 52 }, { width: 80, height: 32 }, { ancestors: ['src'] })],
      ['b', makeNode('b', { x: 16, y: 60 }, { width: 80, height: 32 }, { ancestors: ['src'] })],
    ]);

    const next = reflow(nodesByPath, 'a', { x: 16, y: 52 });
    expect(next.get('b')!.position.y).toBeGreaterThan(52);
    expect((next.get('src')!.height ?? 0) > 100).toBe(true);
  });

  it('cascades a > b > c without teleporting b under c', () => {
    const nodesByPath = new Map([
      ['a', makeNode('a', { x: 0, y: 0 }, { width: 100, height: 100 })],
      ['b', makeNode('b', { x: 0, y: 40 }, { width: 100, height: 40 })],
      ['c', makeNode('c', { x: 0, y: 120 }, { width: 100, height: 40 })],
    ]);

    const next = reflow(nodesByPath, 'a', { x: 0, y: 0 });
    const a = next.get('a')!;
    const b = next.get('b')!;
    const c = next.get('c')!;

    expect(a.position.y).toBe(0);
    expect(b.position.y).toBeGreaterThanOrEqual(a.position.y + 100);
    expect(c.position.y).toBeGreaterThan(b.position.y);
    expect(b.position.y).toBeLessThan(c.position.y);
  });

  it('grows a folder group left when a child is dragged past the content origin', () => {
    const nodesByPath = new Map([
      ['src', makeNode('src', { x: 100, y: 40 }, { width: 200, height: 120 }, { children: [] })],
      ['a', makeNode('a', { x: ORIGIN_X, y: ORIGIN_Y }, { width: 80, height: 32 }, { ancestors: ['src'] })],
      ['b', makeNode('b', { x: 120, y: ORIGIN_Y }, { width: 80, height: 32 }, { ancestors: ['src'] })],
    ]);

    const worldA = { x: 100 + -40, y: 40 + ORIGIN_Y };
    const next = reflow(nodesByPath, 'a', { x: -40, y: ORIGIN_Y });

    expect(next.get('a')!.position.x).toBe(ORIGIN_X);
    expect(next.get('b')!.position.x).toBeGreaterThan(next.get('a')!.position.x);
    expect(next.get('src')!.position.x + next.get('a')!.position.x).toBe(worldA.x);
    expect(next.get('src')!.width).toBeGreaterThan(200);
  });

  it('clears the header origin when a child is dragged upward', () => {
    const nodesByPath = new Map([
      ['src', makeNode('src', { x: 20, y: 80 }, { width: 200, height: 100 }, { children: [] })],
      ['a', makeNode('a', { x: ORIGIN_X, y: ORIGIN_Y }, { width: 80, height: 32 }, { ancestors: ['src'] })],
    ]);

    const worldY = 80 + 10;
    const next = reflow(nodesByPath, 'a', { x: ORIGIN_X, y: 10 });

    expect(next.get('a')!.position.y).toBe(ORIGIN_Y);
    expect(next.get('src')!.position.y + next.get('a')!.position.y).toBe(worldY);
    expect(next.get('src')!.height).toBeGreaterThanOrEqual(ORIGIN_Y + 32 + GROUP_PADDING);
  });

  it('bubbles left growth into a sibling folder group at the parent level', () => {
    const nodesByPath = new Map([
      ['outer', makeNode('outer', { x: 0, y: 0 }, { width: 400, height: 300 }, { children: [] })],
      [
        'groupB',
        makeNode(
          'groupB',
          { x: ORIGIN_X, y: ORIGIN_Y },
          { width: 80, height: 80 },
          {
            ancestors: ['outer'],
            children: [],
          },
        ),
      ],
      [
        'groupA',
        makeNode(
          'groupA',
          { x: 120, y: ORIGIN_Y },
          { width: 120, height: 100 },
          {
            ancestors: ['outer'],
            children: [],
          },
        ),
      ],
      [
        'file',
        makeNode(
          'file',
          { x: ORIGIN_X, y: ORIGIN_Y },
          { width: 80, height: 32 },
          {
            ancestors: ['groupA', 'outer'],
          },
        ),
      ],
    ]);

    const next = reflow(nodesByPath, 'file', { x: -40, y: ORIGIN_Y });

    expect(next.get('file')!.position.x).toBe(ORIGIN_X);
    expect(next.get('groupA')!.position.x).toBeLessThan(120);
    expect(next.get('groupB')!.position.y).toBeGreaterThanOrEqual(
      next.get('groupA')!.position.y + next.get('groupA')!.height,
    );
  });

  it('shrinks left inset when the leftmost child is dragged right', () => {
    const nodesByPath = new Map([
      ['src', makeNode('src', { x: 40, y: 40 }, { width: 280, height: 120 }, { children: [] })],
      ['a', makeNode('a', { x: ORIGIN_X, y: ORIGIN_Y }, { width: 80, height: 32 }, { ancestors: ['src'] })],
      ['b', makeNode('b', { x: 160, y: ORIGIN_Y }, { width: 80, height: 32 }, { ancestors: ['src'] })],
    ]);

    const worldA = { x: 40 + 80, y: 40 + ORIGIN_Y };
    const next = reflow(nodesByPath, 'a', { x: 80, y: ORIGIN_Y });

    expect(next.get('a')!.position.x).toBe(ORIGIN_X);
    expect(next.get('b')!.position.x).toBeGreaterThan(next.get('a')!.position.x);
    expect(next.get('src')!.position.x + next.get('a')!.position.x).toBe(worldA.x);
    expect(next.get('src')!.position.x).toBeGreaterThan(40);
    expect(next.get('src')!.width).toBeLessThan(280);
  });

  it('shrinks top inset when the topmost child is dragged down', () => {
    const nodesByPath = new Map([
      ['src', makeNode('src', { x: 20, y: 20 }, { width: 200, height: 200 }, { children: [] })],
      ['a', makeNode('a', { x: ORIGIN_X, y: ORIGIN_Y }, { width: 80, height: 32 }, { ancestors: ['src'] })],
      ['b', makeNode('b', { x: ORIGIN_X, y: 140 }, { width: 80, height: 32 }, { ancestors: ['src'] })],
    ]);

    const worldA = { x: 20 + ORIGIN_X, y: 20 + 100 };
    const next = reflow(nodesByPath, 'a', { x: ORIGIN_X, y: 100 });

    expect(next.get('a')!.position.y).toBe(ORIGIN_Y);
    expect(next.get('src')!.position.y + next.get('a')!.position.y).toBe(worldA.y);
    expect(next.get('src')!.position.y).toBeGreaterThan(20);
    expect(next.get('src')!.height).toBeLessThan(200);
  });
});
