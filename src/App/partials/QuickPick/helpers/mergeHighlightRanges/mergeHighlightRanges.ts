export interface HighlightRange {
  start: number;
  end: number;
}

/**
 * Merges consecutive character indexes into contiguous highlight ranges.
 *
 * @example
 * mergeHighlightRanges([0, 1, 3]) // [{ start: 0, end: 2 }, { start: 3, end: 4 }]
 */
export function mergeHighlightRanges(sortedIndexes: number[]): HighlightRange[] {
  return sortedIndexes.reduce<HighlightRange[]>((ranges, index) => {
    const last = ranges.at(-1);
    if (last && last.end === index) {
      return [...ranges.slice(0, -1), { start: last.start, end: index + 1 }];
    }
    return [...ranges, { start: index, end: index + 1 }];
  }, []);
}
