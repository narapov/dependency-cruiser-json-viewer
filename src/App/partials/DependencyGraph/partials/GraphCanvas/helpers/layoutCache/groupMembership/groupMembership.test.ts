import { describe, expect, it } from 'vitest';

import type { GroupLayoutEntry, LayoutCache } from '../types';
import { groupMembershipMatches, invalidateGroupLayout, invalidateGroupLayoutRecursive } from './groupMembership';

function makeEntry(childIds: string[]): GroupLayoutEntry {
  return {
    id: 'src',
    width: 100,
    height: 80,
    children: new Map(childIds.map(id => [id, { id, position: { x: 0, y: 0 }, width: 10, height: 10 }])),
  };
}

describe('groupMembershipMatches', () => {
  it('returns false when there is no entry', () => {
    expect(groupMembershipMatches(undefined, ['a'])).toBe(false);
  });

  it('returns true when child id sets match regardless of order', () => {
    const entry = makeEntry(['src/b.ts', 'src/a.ts']);
    expect(groupMembershipMatches(entry, ['src/a.ts', 'src/b.ts'])).toBe(true);
  });

  it('returns false when membership differs', () => {
    const entry = makeEntry(['src/a.ts']);
    expect(groupMembershipMatches(entry, ['src/a.ts', 'src/b.ts'])).toBe(false);
    expect(groupMembershipMatches(entry, ['src/b.ts'])).toBe(false);
  });
});

describe('invalidateGroupLayout / invalidateGroupLayoutRecursive', () => {
  it('drops a single group entry', () => {
    const cache: LayoutCache = new Map([
      ['src', makeEntry(['src/a.ts'])],
      ['src/foo', makeEntry(['src/foo/b.ts'])],
    ]);

    invalidateGroupLayout(cache, 'src');
    expect(cache.has('src')).toBe(false);
    expect(cache.has('src/foo')).toBe(true);
  });

  it('drops a folder and descendant group entries', () => {
    const cache: LayoutCache = new Map([
      [null, makeEntry(['src'])],
      ['src', makeEntry(['src/foo'])],
      ['src/foo', makeEntry(['src/foo/a.ts'])],
      ['lib', makeEntry(['lib/x.ts'])],
    ]);

    invalidateGroupLayoutRecursive(cache, 'src');
    expect(cache.has('src')).toBe(false);
    expect(cache.has('src/foo')).toBe(false);
    expect(cache.has(null)).toBe(true);
    expect(cache.has('lib')).toBe(true);
  });

  it('clears the entire cache when invalidating root recursively', () => {
    const cache: LayoutCache = new Map([
      [null, makeEntry(['src'])],
      ['src', makeEntry(['src/a.ts'])],
    ]);

    invalidateGroupLayoutRecursive(cache, null);
    expect(cache.size).toBe(0);
  });
});
