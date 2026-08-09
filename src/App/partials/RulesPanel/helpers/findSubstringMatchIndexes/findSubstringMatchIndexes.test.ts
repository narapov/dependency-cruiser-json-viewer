import { describe, expect, it } from 'vitest';

import { findSubstringMatchIndexes } from './findSubstringMatchIndexes';

describe('findSubstringMatchIndexes', () => {
  it('returns empty indexes for empty or whitespace query', () => {
    expect(findSubstringMatchIndexes('no-circular', '')).toEqual([]);
    expect(findSubstringMatchIndexes('no-circular', '   ')).toEqual([]);
  });

  it('finds a case-insensitive contiguous match', () => {
    expect(findSubstringMatchIndexes('no-circular', 'CIRC')).toEqual([3, 4, 5, 6]);
  });

  it('finds fuzzy non-contiguous matches', () => {
    expect(findSubstringMatchIndexes('no-circular', 'ncirc')).toEqual([0, 3, 4, 5, 6]);
  });

  it('returns empty indexes when there is no match', () => {
    expect(findSubstringMatchIndexes('no-circular', 'zzz')).toEqual([]);
  });
});
