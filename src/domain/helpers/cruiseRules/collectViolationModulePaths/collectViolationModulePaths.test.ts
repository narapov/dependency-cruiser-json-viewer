import type { IViolation } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { makeDependencyKey } from '../../dependencyKey';
import { collectViolationModulePaths } from './collectViolationModulePaths';

const violationList: IViolation[] = [
  {
    type: 'dependency',
    rule: { name: 'domain-only-domain', severity: 'error' },
    from: 'src/domain/a.ts',
    to: 'src/App/App.tsx',
  },
  {
    type: 'dependency',
    rule: { name: 'domain-only-domain', severity: 'error' },
    from: 'src/domain/b.ts',
    to: 'src/Shared/index.ts',
  },
  {
    type: 'module',
    rule: { name: 'no-orphans', severity: 'warn' },
    from: 'src/orphan.ts',
    to: '',
  },
  {
    type: 'dependency',
    rule: { name: 'no-circular', severity: 'error' },
    from: 'src/a.ts',
    to: 'src/b.ts',
  },
];

function violationsByKey(list: readonly IViolation[]): Map<string, IViolation[]> {
  return Map.groupBy(list, violation => makeDependencyKey(violation.from, violation.to));
}

describe('collectViolationModulePaths', () => {
  it('collects unique from and to paths from all violations', () => {
    expect(collectViolationModulePaths(violationsByKey(violationList)).sort()).toEqual(
      [
        'src/App/App.tsx',
        'src/Shared/index.ts',
        'src/a.ts',
        'src/b.ts',
        'src/domain/a.ts',
        'src/domain/b.ts',
        'src/orphan.ts',
      ].sort(),
    );
  });

  it('filters by rule names when provided', () => {
    expect(collectViolationModulePaths(violationsByKey(violationList), ['domain-only-domain']).sort()).toEqual(
      ['src/App/App.tsx', 'src/Shared/index.ts', 'src/domain/a.ts', 'src/domain/b.ts'].sort(),
    );
  });

  it('returns all paths when rule names is empty', () => {
    const byKey = violationsByKey(violationList);
    expect(collectViolationModulePaths(byKey, []).sort()).toEqual(collectViolationModulePaths(byKey).sort());
  });

  it('returns empty array when the map is empty', () => {
    expect(collectViolationModulePaths(new Map())).toEqual([]);
  });

  it('includes only from when to is missing or equals from', () => {
    const selfViolation: IViolation[] = [
      {
        type: 'module',
        rule: { name: 'self', severity: 'info' },
        from: 'src/self.ts',
        to: 'src/self.ts',
      },
    ];
    expect(collectViolationModulePaths(violationsByKey(selfViolation))).toEqual(['src/self.ts']);
  });
});
