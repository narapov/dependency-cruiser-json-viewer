import { describe, expect, it } from 'vitest';

import type { Node } from '@xyflow/react';

import { getAbsoluteNodePosition } from './getAbsoluteNodePosition';

function makeNode(id: string, x: number, y: number): Node {
  return { id, position: { x, y }, data: {} };
}

describe('getAbsoluteNodePosition', () => {
  it('returns root position as-is', () => {
    const nodeById = new Map([['a', makeNode('a', 100, 200)]]);
    const parentByNode = new Map<string, string | null>([['a', null]]);

    expect(getAbsoluteNodePosition('a', nodeById, parentByNode)).toEqual({ x: 100, y: 200 });
  });

  it('sums relative positions through ancestors', () => {
    const nodeById = new Map([
      ['parent', makeNode('parent', 100, 50)],
      ['child', makeNode('child', 20, 30)],
    ]);
    const parentByNode = new Map<string, string | null>([
      ['parent', null],
      ['child', 'parent'],
    ]);

    expect(getAbsoluteNodePosition('child', nodeById, parentByNode)).toEqual({ x: 120, y: 80 });
  });
});
