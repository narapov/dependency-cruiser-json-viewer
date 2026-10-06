import { describe, expect, it } from 'vitest';

import { getAncestorKeys } from './getAncestorKeys';

describe('getAncestorKeys', () => {
  it('returns ancestors from nearest parent to root', () => {
    expect(getAncestorKeys('src/foo/bar.ts')).toEqual(['src/foo', 'src']);
  });

  it('returns an empty array for a root key', () => {
    expect(getAncestorKeys('src')).toEqual([]);
  });

  it('returns only :buildIn: for built-in snapshot paths', () => {
    expect(getAncestorKeys(':buildIn:')).toEqual([]);
    expect(getAncestorKeys(':buildIn:/crypto')).toEqual([':buildIn:']);
    expect(getAncestorKeys(':buildIn:/node:path/posix')).toEqual([':buildIn:']);
  });
});
