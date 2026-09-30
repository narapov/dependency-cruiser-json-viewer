import { describe, expect, it } from 'vitest';

import type { Node } from '@xyflow/react';

import type { CruisePathNode, CruiseSnapshot } from '@/domain';

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

function snapshotWithAncestors(entries: ReadonlyArray<[string, string[]]>): CruiseSnapshot {
  const nodes = new Map(entries.map(([path, ancestors]) => [path, { path, ancestors } as CruisePathNode]));
  return { nodes } as CruiseSnapshot;
}

describe('sortNodesByDepth', () => {
  it('orders roots before children before grandchildren', () => {
    const nodes = [node('grandchild', 'child'), node('root'), node('child', 'root')];
    const cruiseSnapshot = snapshotWithAncestors([
      ['root', []],
      ['child', ['root']],
      ['grandchild', ['child', 'root']],
    ]);

    expect(sortNodesByDepth(nodes, cruiseSnapshot).map(n => n.id)).toEqual(['root', 'child', 'grandchild']);
  });

  it('keeps relative order among same-depth siblings stable', () => {
    const nodes = [node('b'), node('a'), node('c')];
    const cruiseSnapshot = snapshotWithAncestors([
      ['a', []],
      ['b', []],
      ['c', []],
    ]);

    expect(sortNodesByDepth(nodes, cruiseSnapshot).map(n => n.id)).toEqual(['b', 'a', 'c']);
  });

  it('treats missing snapshot nodes as depth 0', () => {
    const nodes = [node('nested', 'root'), node('orphan')];
    const cruiseSnapshot = snapshotWithAncestors([['nested', ['root']]]);

    expect(sortNodesByDepth(nodes, cruiseSnapshot).map(n => n.id)).toEqual(['orphan', 'nested']);
  });

  it('does not mutate the input array', () => {
    const nodes = [node('child', 'root'), node('root')];
    const cruiseSnapshot = snapshotWithAncestors([
      ['root', []],
      ['child', ['root']],
    ]);
    const originalOrder = nodes.map(n => n.id);

    sortNodesByDepth(nodes, cruiseSnapshot);

    expect(nodes.map(n => n.id)).toEqual(originalOrder);
  });
});
