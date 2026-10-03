import { describe, expect, it } from 'vitest';

import { getDirectChildren } from './getDirectChildren';

describe('getDirectChildren', () => {
  it('returns only nodes whose parent matches folderId', () => {
    const childrenByParent = new Map<string | null, string[]>([
      [null, ['folder']],
      ['folder', ['a', 'b']],
      ['a', ['c']],
    ]);

    expect(getDirectChildren('folder', childrenByParent)).toEqual(['a', 'b']);
  });

  it('supports null root parent', () => {
    const childrenByParent = new Map<string | null, string[]>([
      [null, ['a', 'b']],
      ['a', ['c']],
    ]);

    expect(getDirectChildren(null, childrenByParent)).toEqual(['a', 'b']);
  });

  it('returns sorted ids from the index as-is', () => {
    const childrenByParent = new Map<string | null, string[]>([[null, ['a', 'm', 'z']]]);

    expect(getDirectChildren(null, childrenByParent)).toEqual(['a', 'm', 'z']);
  });

  it('returns empty list when the parent has no children entry', () => {
    const childrenByParent = new Map<string | null, string[]>([[null, ['a', 'b']]]);

    expect(getDirectChildren('missing', childrenByParent)).toEqual([]);
  });
});
