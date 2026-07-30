import { describe, expect, it } from 'vitest';

import { getAncestorKeys } from './getAncestorKeys';

describe('getAncestorKeys', () => {
  it('returns ancestors from nearest parent to root', () => {
    expect(getAncestorKeys('src/foo/bar.ts')).toEqual(['src/foo', 'src']);
  });

  it('returns an empty array for a root key', () => {
    expect(getAncestorKeys('src')).toEqual([]);
  });
});
