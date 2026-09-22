import { describe, expect, it } from 'vitest';

import { avoidRouteToPath, CROSSING_JUMP_RADIUS } from './avoidRouteToPath';

describe('avoidRouteToPath', () => {
  it('builds an absolute polyline from source, bends, and target', () => {
    const path = avoidRouteToPath({
      sourcePoint: { x: 0, y: 0 },
      targetPoint: { x: 30, y: 20 },
      bendPoints: [
        { x: 10, y: 0 },
        { x: 10, y: 20 },
      ],
    });

    expect(path).toBe('M 0 0 L 10 0 L 10 20 L 30 20');
  });

  it('handles a straight route with no bends', () => {
    const path = avoidRouteToPath({
      sourcePoint: { x: 1, y: 2 },
      targetPoint: { x: 3, y: 4 },
      bendPoints: [],
    });

    expect(path).toBe('M 1 2 L 3 4');
  });

  it('inserts an upward semicircle on a left-to-right horizontal crossing', () => {
    const r = CROSSING_JUMP_RADIUS;
    const path = avoidRouteToPath(
      {
        sourcePoint: { x: 0, y: 10 },
        targetPoint: { x: 40, y: 10 },
        bendPoints: [],
      },
      [{ x: 20, y: 10 }],
    );

    expect(path).toBe(`M 0 10 L ${20 - r} 10 A ${r} ${r} 0 0 0 ${20 + r} 10 L 40 10`);
  });

  it('inserts an upward semicircle on a right-to-left horizontal crossing', () => {
    const r = CROSSING_JUMP_RADIUS;
    const path = avoidRouteToPath(
      {
        sourcePoint: { x: 40, y: 10 },
        targetPoint: { x: 0, y: 10 },
        bendPoints: [],
      },
      [{ x: 20, y: 10 }],
    );

    expect(path).toBe(`M 40 10 L ${20 + r} 10 A ${r} ${r} 0 0 1 ${20 - r} 10 L 0 10`);
  });

  it('inserts multiple arcs along one horizontal segment', () => {
    const r = CROSSING_JUMP_RADIUS;
    const path = avoidRouteToPath(
      {
        sourcePoint: { x: 0, y: 10 },
        targetPoint: { x: 50, y: 10 },
        bendPoints: [],
      },
      [
        { x: 15, y: 10 },
        { x: 35, y: 10 },
      ],
    );

    expect(path).toBe(
      `M 0 10 L ${15 - r} 10 A ${r} ${r} 0 0 0 ${15 + r} 10 L ${35 - r} 10 A ${r} ${r} 0 0 0 ${35 + r} 10 L 50 10`,
    );
  });

  it('skips jumps that do not fit on the segment', () => {
    const path = avoidRouteToPath(
      {
        sourcePoint: { x: 0, y: 10 },
        targetPoint: { x: 2, y: 10 },
        bendPoints: [],
      },
      [{ x: 1, y: 10 }],
    );

    expect(path).toBe('M 0 10 L 2 10');
  });
});
