import { describe, expect, it } from 'vitest';

import { resolveEdgePortEndpoint } from './resolveEdgePortEndpoint';

describe('resolveEdgePortEndpoint', () => {
  it('places EAST ports on the right side of the node', () => {
    expect(
      resolveEdgePortEndpoint({
        absolutePosition: { x: 100, y: 50 },
        nodeWidth: 120,
        port: { side: 'east', index: 0, y: 10 },
      }),
    ).toEqual({ x: 220, y: 60 });
  });

  it('places WEST ports on the left side of the node', () => {
    expect(
      resolveEdgePortEndpoint({
        absolutePosition: { x: 100, y: 50 },
        nodeWidth: 120,
        port: { side: 'west', index: 1, y: 20 },
      }),
    ).toEqual({ x: 100, y: 70 });
  });

  it('adds nested-parent absolute offsets to relative port y', () => {
    expect(
      resolveEdgePortEndpoint({
        absolutePosition: { x: 40, y: 80 },
        nodeWidth: 100,
        port: { side: 'east', index: 0, y: 16 },
      }),
    ).toEqual({ x: 140, y: 96 });
  });
});
