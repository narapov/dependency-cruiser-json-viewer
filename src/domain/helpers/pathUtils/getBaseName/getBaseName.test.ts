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

  it('returns the full leaf name under :buildIn:', () => {
    expect(getBaseName(':buildIn:')).toBe(':buildIn:');
    expect(getBaseName(':buildIn:/crypto')).toBe('crypto');
    expect(getBaseName(':buildIn:/node:path/posix')).toBe('node:path/posix');
    expect(getBaseName(':buildIn:/bun:fs')).toBe('bun:fs');
  });
});
