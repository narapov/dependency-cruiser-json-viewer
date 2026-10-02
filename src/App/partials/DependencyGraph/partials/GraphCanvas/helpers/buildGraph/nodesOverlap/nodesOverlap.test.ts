import { describe, expect, it } from 'vitest';

import { nodesOverlap } from './nodesOverlap';

describe('nodesOverlap', () => {
  const size = { width: 100, height: 40 };

  it('returns true when rectangles overlap in area', () => {
    expect(nodesOverlap({ x: 0, y: 0 }, size, { x: 50, y: 10 }, size)).toBe(true);
    expect(nodesOverlap({ x: 0, y: 0 }, size, { x: 99, y: 0 }, size)).toBe(true);
    expect(nodesOverlap({ x: 0, y: 0 }, size, { x: 0, y: 39 }, size)).toBe(true);
  });

  it('returns false when rectangles are separated or only share an edge', () => {
    expect(nodesOverlap({ x: 0, y: 0 }, size, { x: 100, y: 0 }, size)).toBe(false);
    expect(nodesOverlap({ x: 0, y: 0 }, size, { x: 0, y: 40 }, size)).toBe(false);
    expect(nodesOverlap({ x: 0, y: 0 }, size, { x: 101, y: 0 }, size)).toBe(false);
  });

  it('returns true for partial corner overlap', () => {
    expect(nodesOverlap({ x: 0, y: 0 }, size, { x: 90, y: 30 }, size)).toBe(true);
  });
});
