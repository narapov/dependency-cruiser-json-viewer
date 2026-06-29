import { describe, expect, it } from 'vitest';

import { isPathVisibleInSelection } from './isPathVisibleInSelection';

describe('isPathVisibleInSelection', () => {
  it('returns true when path is selected', () => {
    expect(isPathVisibleInSelection('src/foo', ['src/foo'])).toBe(true);
  });

  it('returns true when a descendant is selected', () => {
    expect(isPathVisibleInSelection('src/foo', ['src/foo/bar/baz.ts'])).toBe(true);
  });

  it('returns false when nothing under path is selected', () => {
    expect(isPathVisibleInSelection('src/foo', ['src/other.ts'])).toBe(false);
  });
});
