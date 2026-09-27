import { describe, expect, it } from 'vitest';

import type { AggregatedDependency } from '../../../types';
import { deriveRelationFlagsFromAggregated } from './deriveRelationFlagsFromAggregated';

function dep(
  overrides: Partial<AggregatedDependency> & Pick<AggregatedDependency, 'source' | 'target'>,
): AggregatedDependency {
  return {
    circular: false,
    coreModule: false,
    couldNotResolve: false,
    dependencyTypes: ['local'],
    dynamic: false,
    exoticallyRequired: false,
    followable: true,
    module: overrides.target,
    moduleSystem: 'es6',
    resolved: overrides.target,
    valid: true,
    id: `${overrides.source}->${overrides.target}`,
    ...overrides,
  };
}

describe('deriveRelationFlagsFromAggregated', () => {
  it('returns empty flags for an empty list', () => {
    expect(deriveRelationFlagsFromAggregated([])).toEqual({
      typeOnly: false,
      valueCircular: false,
      typeOnlyCircular: false,
    });
  });

  it('derives flags from a single dependency', () => {
    expect(deriveRelationFlagsFromAggregated([dep({ source: 'a.ts', target: 'b.ts', circular: true })])).toEqual({
      typeOnly: false,
      valueCircular: true,
      typeOnlyCircular: false,
    });
  });

  it('AND-merges typeOnly and ORs circularity across aggregated deps', () => {
    expect(
      deriveRelationFlagsFromAggregated([
        dep({ source: 'a.ts', target: 'b.ts', typeOnly: true }),
        dep({ source: 'a.ts', target: 'b.ts', typeOnly: false, circular: true }),
      ]),
    ).toEqual({
      typeOnly: false,
      valueCircular: true,
      typeOnlyCircular: false,
    });
  });
});
