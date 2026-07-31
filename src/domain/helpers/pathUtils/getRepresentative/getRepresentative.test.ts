import { describe, expect, it } from 'vitest';

import { getRepresentative } from './getRepresentative';

describe('getRepresentative', () => {
  it('bubbles up through collapsed selected parents', () => {
    const selectedSet = new Set(['src', 'src/foo', 'src/foo/a.ts']);
    const expandedFolders = new Set(['src']);

    expect(getRepresentative('src/foo/a.ts', selectedSet, expandedFolders)).toBe('src/foo');
  });

  it('stops at an expanded selected parent', () => {
    const selectedSet = new Set(['src', 'src/foo', 'src/foo/a.ts']);
    const expandedFolders = new Set(['src', 'src/foo']);

    expect(getRepresentative('src/foo/a.ts', selectedSet, expandedFolders)).toBe('src/foo/a.ts');
  });

  it('stops when the parent is not selected', () => {
    const selectedSet = new Set(['src/foo/a.ts']);
    const expandedFolders = new Set<string>();

    expect(getRepresentative('src/foo/a.ts', selectedSet, expandedFolders)).toBe('src/foo/a.ts');
  });
});
