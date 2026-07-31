import { describe, expect, it } from 'vitest';

import { getBaseName } from './getBaseName';

describe('getBaseName', () => {
  it('returns the last path segment', () => {
    expect(getBaseName('src/foo/bar.ts')).toBe('bar.ts');
    expect(getBaseName('src/foo')).toBe('foo');
  });

  it('returns the whole string when there is no slash', () => {
    expect(getBaseName('index.ts')).toBe('index.ts');
  });
});
