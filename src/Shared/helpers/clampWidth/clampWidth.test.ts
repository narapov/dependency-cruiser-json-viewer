import { describe, expect, it } from 'vitest';

import { clampWidth } from './clampWidth';

describe('clampWidth', () => {
  it('returns width when within bounds', () => {
    expect(clampWidth(280, 150, 800)).toBe(280);
  });

  it('clamps to minWidth when below', () => {
    expect(clampWidth(100, 150, 800)).toBe(150);
  });

  it('clamps to maxWidth when above', () => {
    expect(clampWidth(900, 150, 600)).toBe(600);
  });
});
