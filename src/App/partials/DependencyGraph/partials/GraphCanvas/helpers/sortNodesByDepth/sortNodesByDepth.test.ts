import { describe, expect, it } from 'vitest';

import type { Node } from '@xyflow/react';

import { sortNodesByDepth } from './sortNodesByDepth';

function node(id: string, parentId?: string): Node {
  return {
    id,
    type: 'file',
    position: { x: 0, y: 0 },
    data: {},
    ...(parentId ? { parentId } : {}),
  };
}

describe('sortNodesByDepth', () => {
  it('orders roots before children before grandchildren', () => {
    const nodes = [node('grandchild', 'child'), node('root'), node('child', 'root')];
    const depthById = new Map([
      ['root', 0],
      ['child', 1],
      ['grandchild', 2],
    ]);

    expect(sortNodesByDepth(nodes, depthById).map(n => n.id)).toEqual(['root', 'child', 'grandchild']);
  });

  it('keeps relative order among same-depth siblings stable', () => {
    const nodes = [node('b'), node('a'), node('c')];
    const depthById = new Map([
      ['a', 0],
      ['b', 0],
      ['c', 0],
    ]);

    expect(sortNodesByDepth(nodes, depthById).map(n => n.id)).toEqual(['b', 'a', 'c']);
  });

  it('treats missing depth entries as depth 0', () => {
    const nodes = [node('nested', 'root'), node('orphan')];
    const depthById = new Map([['nested', 1]]);

    expect(sortNodesByDepth(nodes, depthById).map(n => n.id)).toEqual(['orphan', 'nested']);
  });

  it('does not mutate the input array', () => {
    const nodes = [node('child', 'root'), node('root')];
    const depthById = new Map([
      ['root', 0],
      ['child', 1],
    ]);
    const originalOrder = nodes.map(n => n.id);

    sortNodesByDepth(nodes, depthById);

    expect(nodes.map(n => n.id)).toEqual(originalOrder);
  });
});
