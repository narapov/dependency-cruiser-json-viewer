import { describe, expect, it } from 'vitest';

import { CROSSING_JUMP_RADIUS, ORTHOGONAL_CORNER_RADIUS } from './edgePathConstants';

describe('edgePathConstants', () => {
  it('defines shared orthogonal presentation radii', () => {
    expect(ORTHOGONAL_CORNER_RADIUS).toBe(3);
    expect(CROSSING_JUMP_RADIUS).toBe(1.5);
  });
});
