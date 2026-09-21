import { describe, expect, it } from 'vitest';

import { avoidRouteToPath } from './avoidRouteToPath';

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
});
