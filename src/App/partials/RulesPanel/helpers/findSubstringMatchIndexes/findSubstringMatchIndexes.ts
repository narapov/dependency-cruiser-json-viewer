import fuzzysort from 'fuzzysort';

/**
 * Returns fuzzysort character indexes for a query against text.
 *
 * @example
 * findSubstringMatchIndexes('no-circular', 'CIRC') // [3, 4, 5, 6]
 */
export function findSubstringMatchIndexes(text: string, query: string): number[] {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return [];
  }

  const result = fuzzysort.single(trimmed, text);
  return result ? [...result.indexes] : [];
}
