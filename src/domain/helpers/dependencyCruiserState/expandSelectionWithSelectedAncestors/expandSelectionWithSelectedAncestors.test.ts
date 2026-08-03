import { describe, expect, it } from 'vitest';

import { expandSelectionWithSelectedAncestors } from './expandSelectionWithSelectedAncestors';

describe('expandSelectionWithSelectedAncestors', () => {
  const sources = ['src/a.ts', 'src/foo/b.ts', 'src/foo/c.ts', 'lib/x.ts'];

  it('adds all ancestors when every file under them is selected', () => {
    const selected = expandSelectionWithSelectedAncestors(
      ['src/a.ts', 'src/foo/b.ts', 'src/foo/c.ts', 'lib/x.ts'],
      sources,
    );

    expect(selected).toEqual(
      expect.arrayContaining(['src/a.ts', 'src/foo/b.ts', 'src/foo/c.ts', 'lib/x.ts', 'src/foo', 'src', 'lib']),
    );
    expect(selected).toHaveLength(7);
  });

  it('adds only fully-selected deepest folders for a partial selection', () => {
    const selected = expandSelectionWithSelectedAncestors(['src/foo/b.ts', 'src/foo/c.ts'], sources);

    expect(selected).toEqual(expect.arrayContaining(['src/foo/b.ts', 'src/foo/c.ts', 'src/foo']));
    expect(selected).not.toContain('src');
    expect(selected).not.toContain('lib');
    expect(selected).toHaveLength(3);
  });

  it('does not add a folder when only some files under it are selected', () => {
    const selected = expandSelectionWithSelectedAncestors(['src/foo/b.ts'], sources);

    expect(selected).toEqual(['src/foo/b.ts']);
  });

  it('returns the same paths when selection is empty', () => {
    expect(expandSelectionWithSelectedAncestors([], sources)).toEqual([]);
  });

  it('ignores selected paths that are not in sources when deciding folders', () => {
    const selected = expandSelectionWithSelectedAncestors(['src/foo/b.ts', 'src/foo/c.ts', 'gone.ts'], sources);

    expect(selected).toEqual(expect.arrayContaining(['src/foo/b.ts', 'src/foo/c.ts', 'gone.ts', 'src/foo']));
    expect(selected).not.toContain('src');
  });
});
