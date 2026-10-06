import { describe, expect, it } from 'vitest';

import { BUILT_IN_PREFIX, BUILT_IN_ROOT, isBuiltInPath } from './isBuiltInPath';

describe('isBuiltInPath', () => {
  it('returns true for the synthetic root', () => {
    expect(isBuiltInPath(BUILT_IN_ROOT)).toBe(true);
  });

  it('returns true for bare and protocol-prefixed leaves', () => {
    expect(isBuiltInPath(`${BUILT_IN_PREFIX}crypto`)).toBe(true);
    expect(isBuiltInPath(`${BUILT_IN_PREFIX}node:path/posix`)).toBe(true);
    expect(isBuiltInPath(`${BUILT_IN_PREFIX}bun:fs`)).toBe(true);
  });

  it('returns false for project and node_modules paths', () => {
    expect(isBuiltInPath('src/foo.ts')).toBe(false);
    expect(isBuiltInPath('node_modules/pkg/index.js')).toBe(false);
    expect(isBuiltInPath('crypto')).toBe(false);
    expect(isBuiltInPath('node:fs')).toBe(false);
  });
});
