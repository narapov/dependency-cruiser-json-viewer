import { describe, expect, it } from 'vitest';

import { CROSSING_JUMP_RADIUS, ORTHOGONAL_CORNER_RADIUS } from '../../constants';
import { avoidRouteToPath } from './avoidRouteToPath';

describe('avoidRouteToPath', () => {
  it('builds a path with quadratic fillets at orthogonal bends', () => {
    const r = ORTHOGONAL_CORNER_RADIUS;
    const path = avoidRouteToPath({
      sourcePoint: { x: 0, y: 0 },
      targetPoint: { x: 30, y: 20 },
      bendPoints: [
        { x: 10, y: 0 },
        { x: 10, y: 20 },
      ],
    });

    expect(path).toBe(`M 0 0 L ${10 - r} 0 Q 10 0 10 ${r} L 10 ${20 - r} Q 10 20 ${10 + r} 20 L 30 20`);
  });

  it('clamps fillet radius on short segments', () => {
    const path = avoidRouteToPath({
      sourcePoint: { x: 0, y: 0 },
      targetPoint: { x: 4, y: 4 },
      bendPoints: [{ x: 2, y: 0 }],
    });

    // Adjacent lengths 2 and ~4.47 → bendSize = min(1, ~2.23, 3) = 1
    expect(path).toBe('M 0 0 L 1 0 Q 2 0 2 1 L 4 4');
  });

  it('keeps collinear interior points as plain L', () => {
    const path = avoidRouteToPath({
      sourcePoint: { x: 0, y: 0 },
      targetPoint: { x: 30, y: 0 },
      bendPoints: [
        { x: 10, y: 0 },
        { x: 20, y: 0 },
      ],
    });

    expect(path).toBe('M 0 0 L 10 0 L 20 0 L 30 0');
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

  it('keeps hop radius 1.5 when bends are also filleted', () => {
    const hop = CROSSING_JUMP_RADIUS;
    const corner = ORTHOGONAL_CORNER_RADIUS;
    const path = avoidRouteToPath(
      {
        sourcePoint: { x: 0, y: 0 },
        targetPoint: { x: 40, y: 20 },
        bendPoints: [
          { x: 0, y: 10 },
          { x: 40, y: 10 },
        ],
      },
      [{ x: 20, y: 10 }],
    );

    expect(path).toContain(`A ${hop} ${hop} `);
    expect(path).toContain(`Q 0 10 ${corner} 10`);
    expect(path).toContain(`Q 40 10 40 ${10 + corner}`);
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
