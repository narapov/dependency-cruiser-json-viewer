import { describe, expect, it } from 'vitest';

import { mergeHighlightRanges } from './mergeHighlightRanges';

describe('mergeHighlightRanges', () => {
  it('returns empty array for no indexes', () => {
    expect(mergeHighlightRanges([])).toEqual([]);
  });

  it('creates a single-character range', () => {
    expect(mergeHighlightRanges([2])).toEqual([{ start: 2, end: 3 }]);
  });

  it('merges consecutive indexes', () => {
    expect(mergeHighlightRanges([0, 1, 2])).toEqual([{ start: 0, end: 3 }]);
  });

  it('keeps gaps as separate ranges', () => {
    expect(mergeHighlightRanges([0, 1, 3, 5, 6])).toEqual([
      { start: 0, end: 2 },
      { start: 3, end: 4 },
      { start: 5, end: 7 },
    ]);
  });
});
