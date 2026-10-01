import { describe, expect, it } from 'vitest';

import { getGroupDepth } from './getGroupDepth';

describe('getGroupDepth', () => {
  const parentByNode = new Map<string, string | null>([
    ['root', null],
    ['child', 'root'],
    ['grandchild', 'child'],
  ]);

  it('returns 0 for the root viewport (null)', () => {
    expect(getGroupDepth(null, parentByNode)).toBe(0);
  });

  it('returns 1 for a root-level group', () => {
    expect(getGroupDepth('root', parentByNode)).toBe(1);
  });

  it('counts ancestors for nested groups', () => {
    expect(getGroupDepth('child', parentByNode)).toBe(2);
    expect(getGroupDepth('grandchild', parentByNode)).toBe(3);
  });
});
