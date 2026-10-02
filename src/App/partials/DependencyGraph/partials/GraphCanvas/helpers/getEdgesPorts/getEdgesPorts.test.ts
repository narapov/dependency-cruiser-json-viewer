import { describe, expect, it } from 'vitest';

import { createDependencyViolationFlags, type VisibleTreeEdge } from '@/domain';

import type { VisibleTreeLayoutedNode } from '../../types';
import { edgePortY, getEdgesPorts } from './getEdgesPorts';

function layouted(
  overrides: Partial<VisibleTreeLayoutedNode> & Pick<VisibleTreeLayoutedNode, 'path'>,
): VisibleTreeLayoutedNode {
  return {
    ancestors: [],
    descendants: [],
    valueCircular: false,
    typeOnlyCircular: false,
    position: { x: 0, y: 0 },
    width: 100,
    height: 40,
    ...overrides,
  };
}

function edge(id: string, source: string, target: string): VisibleTreeEdge {
  return {
    key: id,
    source,
    target,
    aggregated: [],
    typeOnly: false,
    valueCircular: false,
    typeOnlyCircular: false,
    violations: createDependencyViolationFlags({ couldNotResolve: false, rules: [] }),
  };
}

describe('edgePortY', () => {
  it('places a single port at mid-height', () => {
    expect(edgePortY(0, 1, 40)).toBe(20);
  });

  it('spreads three ports evenly', () => {
    expect(edgePortY(0, 3, 40)).toBe(10);
    expect(edgePortY(1, 3, 40)).toBe(20);
    expect(edgePortY(2, 3, 40)).toBe(30);
  });
});

describe('getEdgesPorts', () => {
  it('assigns distinct EAST slots top-to-bottom by target center Y', () => {
    const tree = [
      layouted({ path: 'src', position: { x: 0, y: 0 }, width: 100, height: 40 }),
      layouted({ path: 'top', position: { x: 200, y: 0 }, width: 100, height: 40 }),
      layouted({ path: 'mid', position: { x: 200, y: 100 }, width: 100, height: 40 }),
      layouted({ path: 'bot', position: { x: 200, y: 200 }, width: 100, height: 40 }),
    ];
    const edges = [edge('to-bot', 'src', 'bot'), edge('to-top', 'src', 'top'), edge('to-mid', 'src', 'mid')];

    const ports = getEdgesPorts(tree, edges);

    expect(ports.get('to-top')?.source).toEqual({ side: 'east', index: 0, y: 10 });
    expect(ports.get('to-mid')?.source).toEqual({ side: 'east', index: 1, y: 20 });
    expect(ports.get('to-bot')?.source).toEqual({ side: 'east', index: 2, y: 30 });
  });

  it('assigns distinct WEST slots top-to-bottom by source center Y', () => {
    const tree = [
      layouted({ path: 'tgt', position: { x: 200, y: 0 }, width: 100, height: 40 }),
      layouted({ path: 'top', position: { x: 0, y: 0 }, width: 100, height: 40 }),
      layouted({ path: 'mid', position: { x: 0, y: 100 }, width: 100, height: 40 }),
      layouted({ path: 'bot', position: { x: 0, y: 200 }, width: 100, height: 40 }),
    ];
    const edges = [edge('from-bot', 'bot', 'tgt'), edge('from-top', 'top', 'tgt'), edge('from-mid', 'mid', 'tgt')];

    const ports = getEdgesPorts(tree, edges);

    expect(ports.get('from-top')?.target).toEqual({ side: 'west', index: 0, y: 10 });
    expect(ports.get('from-mid')?.target).toEqual({ side: 'west', index: 1, y: 20 });
    expect(ports.get('from-bot')?.target).toEqual({ side: 'west', index: 2, y: 30 });
  });

  it('uses absolute centers through nested parents via ancestors', () => {
    const tree = [
      layouted({
        path: 'group',
        position: { x: 0, y: 100 },
        width: 400,
        height: 200,
        descendants: ['a', 'b'],
        children: [
          layouted({ path: 'a', ancestors: ['group'], position: { x: 10, y: 20 }, width: 100, height: 40 }),
          layouted({ path: 'b', ancestors: ['group'], position: { x: 200, y: 80 }, width: 100, height: 40 }),
        ],
      }),
    ];
    const edges = [edge('a->b', 'a', 'b')];

    const ports = getEdgesPorts(tree, edges);

    expect(ports.get('a->b')).toEqual({
      source: { side: 'east', index: 0, y: 20 },
      target: { side: 'west', index: 0, y: 20 },
    });
  });
});
