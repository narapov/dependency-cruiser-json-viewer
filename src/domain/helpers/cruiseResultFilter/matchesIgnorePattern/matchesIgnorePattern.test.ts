import { describe, expect, it } from 'vitest';

import { matchesIgnorePattern } from './matchesIgnorePattern';

describe('matchesIgnorePattern', () => {
  it('matches test files with glob pattern', () => {
    expect(matchesIgnorePattern('src/foo/bar.test.ts', '**/*.test.ts')).toBe(true);
    expect(matchesIgnorePattern('src/foo/bar.ts', '**/*.test.ts')).toBe(false);
  });

  it('ignores empty patterns', () => {
    expect(matchesIgnorePattern('src/foo/bar.test.ts', '')).toBe(false);
    expect(matchesIgnorePattern('src/foo/bar.test.ts', '   ')).toBe(false);
  });

  it('returns false for invalid glob patterns', () => {
    expect(matchesIgnorePattern('src/foo/bar.ts', '[')).toBe(false);
  });
});
