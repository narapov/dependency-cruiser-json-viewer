import fuzzysort from 'fuzzysort';

/**
 * Returns whether a rule name matches the fuzzy name filter.
 *
 * @example
 * matchesNameFilter('no-circular', '') // true
 * matchesNameFilter('no-circular', 'ncirc') // true
 * matchesNameFilter('no-circular', 'zzz') // false
 */
export function matchesNameFilter(name: string, filter: string): boolean {
  const trimmed = filter.trim();
  if (trimmed.length === 0) {
    return true;
  }
  return fuzzysort.single(trimmed, name) != null;
}
