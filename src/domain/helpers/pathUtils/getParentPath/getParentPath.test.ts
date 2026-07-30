import { describe, expect, it } from 'vitest';

import { getParentPath } from './getParentPath';

describe('getParentPath', () => {
  it('returns the parent path for nested paths', () => {
    expect(getParentPath('src/foo/bar.ts')).toBe('src/foo');
    expect(getParentPath('src/foo')).toBe('src');
  });

  it('returns null for a single path segment', () => {
    expect(getParentPath('src')).toBeNull();
    expect(getParentPath('index.ts')).toBeNull();
  });
});
