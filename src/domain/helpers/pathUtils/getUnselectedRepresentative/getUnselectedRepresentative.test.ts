import { describe, expect, it } from 'vitest';

import { getUnselectedRepresentative } from './getUnselectedRepresentative';

describe('getUnselectedRepresentative', () => {
  it('bubbles up through unselected folder ancestors', () => {
    const selectedSet = new Set(['src']);
    const folderSet = new Set(['src', 'src/vendor']);

    expect(getUnselectedRepresentative('src/vendor/a.ts', selectedSet, folderSet)).toBe('src/vendor');
  });

  it('stops at a selected parent', () => {
    const selectedSet = new Set(['src', 'src/vendor']);
    const folderSet = new Set(['src', 'src/vendor']);

    expect(getUnselectedRepresentative('src/vendor/a.ts', selectedSet, folderSet)).toBe('src/vendor/a.ts');
  });

  it('returns the path when the parent folder is selected', () => {
    const selectedSet = new Set(['src', 'src/a.ts']);
    const folderSet = new Set(['src']);

    expect(getUnselectedRepresentative('src/a.ts', selectedSet, folderSet)).toBe('src/a.ts');
  });

  it('climbs to the outermost unselected folder', () => {
    const selectedSet = new Set(['src']);
    const folderSet = new Set(['src', 'lib', 'lib/vendor']);

    expect(getUnselectedRepresentative('lib/vendor/a.ts', selectedSet, folderSet)).toBe('lib');
  });

  it('climbs multiple unselected folder levels under a selected root', () => {
    const selectedSet = new Set(['src']);
    const folderSet = new Set(['src', 'src/vendor', 'src/vendor/pkg']);

    expect(getUnselectedRepresentative('src/vendor/pkg/a.ts', selectedSet, folderSet)).toBe('src/vendor');
  });
});
