import { describe, expect, it } from 'vitest';

import { buildGroupFingerprints } from './buildGroupFingerprints';

describe('buildGroupFingerprints', () => {
  it('builds fingerprint from sorted direct children', () => {
    const parentByNode = new Map<string, string | null>([
      ['a', null],
      ['b', null],
      ['c', 'a'],
    ]);
    const fingerprints = buildGroupFingerprints(new Set(['a', 'b', 'c']), parentByNode);

    expect(fingerprints.get(null)).toBe('a,b');
    expect(fingerprints.get('a')).toBe('c');
  });

  it('returns only root fingerprint for empty node ids', () => {
    const fingerprints = buildGroupFingerprints(new Set(), new Map());

    expect([...fingerprints.entries()]).toEqual([[null, '']]);
  });

  it('treats nodes missing from parentByNode as root children', () => {
    const fingerprints = buildGroupFingerprints(new Set(['orphan']), new Map());

    expect(fingerprints.get(null)).toBe('orphan');
  });
});
