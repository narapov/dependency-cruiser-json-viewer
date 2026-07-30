import { describe, expect, it } from 'vitest';

import { isUnderFolder } from './isUnderFolder';

describe('isUnderFolder', () => {
  it('returns true for the folder itself', () => {
    expect(isUnderFolder('src/foo', 'src/foo')).toBe(true);
  });

  it('returns true for paths under the folder', () => {
    expect(isUnderFolder('src/foo/bar.ts', 'src/foo')).toBe(true);
    expect(isUnderFolder('src/foo/bar/baz.ts', 'src/foo')).toBe(true);
  });

  it('returns false for sibling prefix paths', () => {
    expect(isUnderFolder('src/foobar', 'src/foo')).toBe(false);
    expect(isUnderFolder('src/foo.ts', 'src/foo')).toBe(false);
  });
});
