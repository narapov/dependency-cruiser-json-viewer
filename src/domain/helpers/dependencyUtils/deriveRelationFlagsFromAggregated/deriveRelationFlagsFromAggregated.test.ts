import { describe, expect, it } from 'vitest';

import type { ModuleDependency } from '../../../types';
import { deriveRelationFlagsFromAggregated } from './deriveRelationFlagsFromAggregated';

function dep(overrides: Partial<ModuleDependency> & Pick<ModuleDependency, 'source' | 'target'>): ModuleDependency {
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
    sourceAncestors: [],
    targetAncestors: [],
    protocol: 'file:',
    ...overrides,
  } as ModuleDependency;
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
