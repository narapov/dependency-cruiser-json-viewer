import { describe, expect, it } from 'vitest';

import { matchesNameFilter } from './matchesNameFilter';

describe('matchesNameFilter', () => {
  it('matches any name when the filter is empty or whitespace', () => {
    expect(matchesNameFilter('no-circular', '')).toBe(true);
    expect(matchesNameFilter('no-circular', '   ')).toBe(true);
  });

  it('matches fuzzy rule names', () => {
    expect(matchesNameFilter('no-circular', 'ncirc')).toBe(true);
    expect(matchesNameFilter('no-circular', 'CIRC')).toBe(true);
  });

  it('rejects names that do not match', () => {
    expect(matchesNameFilter('no-circular', 'zzz')).toBe(false);
  });
});
