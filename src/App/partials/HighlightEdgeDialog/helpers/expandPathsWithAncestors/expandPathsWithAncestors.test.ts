import { describe, expect, it } from 'vitest';

import { buildCruiseSnapshot, type CruiseSnapshot } from '@/domain';

import { expandPathsWithAncestors } from './expandPathsWithAncestors';

describe('expandPathsWithAncestors', () => {
  it('includes related files and their ancestor folders', () => {
    const cruiseSnapshot = buildCruiseSnapshot([
      { source: 'src/foo/b.ts', dependencies: [], dependents: [], valid: true },
      { source: 'src/foo/c.ts', dependencies: [], dependents: [], valid: true },
    ]) as CruiseSnapshot;

    const allowed = expandPathsWithAncestors(['src/foo/b.ts', 'src/foo/c.ts'], cruiseSnapshot).sort();

    expect(allowed).toEqual(['src', 'src/foo', 'src/foo/b.ts', 'src/foo/c.ts'].sort());
  });
});
