import { describe, expect, it } from 'vitest';

import { DEFAULT_EDGE_COLOR } from '@/Shared';

import { isEdgeEmphasized } from './isEdgeEmphasized';

describe('isEdgeEmphasized', () => {
  it('returns true for selected and custom-stroke edges', () => {
    expect(isEdgeEmphasized(undefined, true)).toBe(true);
    expect(isEdgeEmphasized({ stroke: '#f00' }, false)).toBe(true);
  });

  it('returns false for unselected default edges', () => {
    expect(isEdgeEmphasized(undefined, false)).toBe(false);
    expect(isEdgeEmphasized({ stroke: DEFAULT_EDGE_COLOR }, undefined)).toBe(false);
  });
});
