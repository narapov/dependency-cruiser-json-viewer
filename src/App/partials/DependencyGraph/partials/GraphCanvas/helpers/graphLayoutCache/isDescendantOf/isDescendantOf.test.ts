import { describe, expect, it } from 'vitest';

import { isDescendantOf } from './isDescendantOf';

describe('isDescendantOf', () => {
  const parentByNode = new Map<string, string | null>([
    ['root', null],
    ['child', 'root'],
    ['grandchild', 'child'],
    ['sibling', 'root'],
    ['unrelated', null],
  ]);

  it('returns true when ancestor is a parent or grandparent', () => {
    expect(isDescendantOf('child', 'root', parentByNode)).toBe(true);
    expect(isDescendantOf('grandchild', 'root', parentByNode)).toBe(true);
    expect(isDescendantOf('grandchild', 'child', parentByNode)).toBe(true);
  });

  it('returns false for sibling, self, or unrelated nodes', () => {
    expect(isDescendantOf('sibling', 'child', parentByNode)).toBe(false);
    expect(isDescendantOf('child', 'child', parentByNode)).toBe(false);
    expect(isDescendantOf('unrelated', 'root', parentByNode)).toBe(false);
  });

  it('returns false when the parent map has no chain to the ancestor', () => {
    expect(isDescendantOf('missing', 'root', parentByNode)).toBe(false);
    expect(isDescendantOf('grandchild', 'missing', parentByNode)).toBe(false);
  });
});
