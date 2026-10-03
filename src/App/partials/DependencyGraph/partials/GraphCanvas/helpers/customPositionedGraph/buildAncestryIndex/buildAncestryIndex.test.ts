import { describe, expect, it } from 'vitest';

import { buildAncestryIndex } from './buildAncestryIndex';

describe('buildAncestryIndex', () => {
  it('maps parent and siblings from ancestors[0]', () => {
    const nodes = new Map([
      ['src', { path: 'src', ancestors: [] }],
      ['src/foo', { path: 'src/foo', ancestors: ['src'] }],
      ['src/foo/a.ts', { path: 'src/foo/a.ts', ancestors: ['src/foo', 'src'] }],
      ['src/foo/b.ts', { path: 'src/foo/b.ts', ancestors: ['src/foo', 'src'] }],
      ['src/bar.ts', { path: 'src/bar.ts', ancestors: ['src'] }],
    ]);

    const { parentByNode, childrenByParent } = buildAncestryIndex(nodes);

    expect(parentByNode.get('src')).toBeNull();
    expect(parentByNode.get('src/foo')).toBe('src');
    expect(parentByNode.get('src/foo/a.ts')).toBe('src/foo');
    expect(parentByNode.get('src/bar.ts')).toBe('src');

    expect(childrenByParent.get(null)).toEqual(['src']);
    expect(childrenByParent.get('src')).toEqual(['src/bar.ts', 'src/foo']);
    expect(childrenByParent.get('src/foo')).toEqual(['src/foo/a.ts', 'src/foo/b.ts']);
  });

  it('treats missing ancestors as root children', () => {
    const nodes = new Map([
      ['a', { path: 'a', ancestors: [] }],
      ['b', { path: 'b', ancestors: [] }],
    ]);

    const { parentByNode, childrenByParent } = buildAncestryIndex(nodes);

    expect(parentByNode.get('a')).toBeNull();
    expect(parentByNode.get('b')).toBeNull();
    expect(childrenByParent.get(null)).toEqual(['a', 'b']);
  });
});
