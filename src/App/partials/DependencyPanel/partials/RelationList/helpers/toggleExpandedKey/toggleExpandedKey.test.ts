import { describe, expect, it } from 'vitest';

import { toggleExpandedKey } from './toggleExpandedKey';

describe('toggleExpandedKey', () => {
  it('adds a missing key', () => {
    expect(toggleExpandedKey(new Set(['a']), 'b')).toEqual(new Set(['a', 'b']));
  });

  it('removes an existing key', () => {
    expect(toggleExpandedKey(new Set(['a', 'b']), 'a')).toEqual(new Set(['b']));
  });

  it('does not mutate the previous set', () => {
    const prev = new Set(['a']);
    toggleExpandedKey(prev, 'b');
    expect(prev).toEqual(new Set(['a']));
  });
});
