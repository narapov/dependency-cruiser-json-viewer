import { describe, expect, it } from 'vitest';

import type { Node } from '@xyflow/react';

import { sortNodesByDepth } from './sortNodesByDepth';

function node(id: string, parentId?: string): Node {
  return {
    id,
    type: 'file',
    position: { x: 0, y: 0 },
    data: {},
    ...(parentId != null ? { parentId } : {}),
  };
}

describe('sortNodesByDepth', () => {
  it('orders roots before children before grandchildren', () => {
    const nodes = [node('grandchild', 'child'), node('root'), node('child', 'root')];

    expect(sortNodesByDepth(nodes).map(n => n.id)).toEqual(['root', 'child', 'grandchild']);
  });

  it('keeps relative order among same-depth siblings stable', () => {
    const nodes = [node('b'), node('a'), node('c')];

    expect(sortNodesByDepth(nodes).map(n => n.id)).toEqual(['b', 'a', 'c']);
  });

  it('treats missing parentId as depth 0', () => {
    const nodes = [node('nested', 'root'), node('orphan')];

    expect(sortNodesByDepth(nodes).map(n => n.id)).toEqual(['orphan', 'nested']);
  });

  it('does not mutate the input array', () => {
    const nodes = [node('child', 'root'), node('root')];
    const originalOrder = nodes.map(n => n.id);

    sortNodesByDepth(nodes);

    expect(nodes.map(n => n.id)).toEqual(originalOrder);
  });
});
