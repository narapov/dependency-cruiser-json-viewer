import { describe, expect, it } from 'vitest';

import { isIgnoredPath } from './isIgnoredPath';

describe('isIgnoredPath', () => {
  it('matches if any pattern matches', () => {
    expect(isIgnoredPath('src/foo/bar.stories.tsx', ['**/*.test.ts', '**/*.stories.tsx'])).toBe(true);
    expect(isIgnoredPath('src/foo/bar.ts', ['**/*.test.ts', '**/*.stories.tsx'])).toBe(false);
  });
});
