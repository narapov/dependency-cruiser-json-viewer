import { describe, expect, it } from 'vitest';

import { removeSubtreeFolderKeys } from './removeSubtreeFolderKeys';

const sources = ['src/index.ts', 'src/foo/index.ts', 'src/foo/bar/index.ts', 'src/baz/index.ts'];

describe('removeSubtreeFolderKeys', () => {
  it('removes folder and descendant folders from expanded keys', () => {
    const keys = ['src', 'src/foo', 'src/foo/bar', 'src/baz'];
    expect(removeSubtreeFolderKeys(keys, 'src/foo', sources)).toEqual(['src', 'src/baz']);
  });

  it('returns keys unchanged when folder is not expanded', () => {
    const keys = ['src', 'src/baz'];
    expect(removeSubtreeFolderKeys(keys, 'src/foo', sources)).toEqual(['src', 'src/baz']);
  });
});
