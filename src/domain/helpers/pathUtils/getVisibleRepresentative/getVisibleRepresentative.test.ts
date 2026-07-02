import { describe, expect, it } from 'vitest';

import { getVisibleRepresentative } from './getVisibleRepresentative';

describe('getVisibleRepresentative', () => {
  const selectedSet = new Set(['src/foo/a.ts', 'src/foo/b.ts', 'src/bar/c.ts']);

  it('returns the same representative when the node is visible', () => {
    const visibleNodeIds = new Set(['src', 'src/foo', 'src/foo/a.ts', 'src/foo/b.ts', 'src/bar/c.ts']);

    expect(
      getVisibleRepresentative('src/foo/a.ts', selectedSet, new Set(['src', 'src/foo', 'src/bar']), visibleNodeIds),
    ).toBe('src/foo/a.ts');
  });

  it('snaps to a visible collapsed folder when the file representative is hidden', () => {
    const visibleNodeIds = new Set(['src', 'src/foo', 'src/foo/bar']);

    expect(getVisibleRepresentative('src/foo/bar/a.ts', selectedSet, new Set(['src', 'src/foo']), visibleNodeIds)).toBe(
      'src/foo/bar',
    );
  });

  it('collapses to a selected folder representative that remains visible', () => {
    const folderSelected = new Set(['src/foo', 'src/foo/a.ts', 'src/bar/c.ts']);
    const visibleNodeIds = new Set(['src', 'src/foo', 'src/bar/c.ts']);

    expect(getVisibleRepresentative('src/foo/a.ts', folderSelected, new Set(['src']), visibleNodeIds)).toBe('src/foo');
  });
});
