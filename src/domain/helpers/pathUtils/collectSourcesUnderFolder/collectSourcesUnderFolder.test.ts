import { describe, expect, it } from 'vitest';

import { collectSourcesUnderFolder } from './collectSourcesUnderFolder';

describe('collectSourcesUnderFolder', () => {
  const sources = ['src/foo/a.ts', 'src/foo/bar/b.ts', 'src/baz/c.ts', 'src/foo'];

  it('returns modules strictly under the folder', () => {
    expect(collectSourcesUnderFolder('src/foo', sources)).toEqual(['src/foo/a.ts', 'src/foo/bar/b.ts']);
  });

  it('excludes a source that equals the folder path', () => {
    expect(collectSourcesUnderFolder('src/foo', sources)).not.toContain('src/foo');
  });

  it('returns an empty list when nothing is under the folder', () => {
    expect(collectSourcesUnderFolder('lib', sources)).toEqual([]);
  });

  it('does not match sibling prefixes', () => {
    expect(collectSourcesUnderFolder('src/fo', sources)).toEqual([]);
  });
});
