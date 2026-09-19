import type { IViolation } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { collectViolationModulePaths } from './collectViolationModulePaths';

const violations: IViolation[] = [
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

describe('collectViolationModulePaths', () => {
  it('collects unique from and to paths from all violations', () => {
    expect(collectViolationModulePaths(violations).sort()).toEqual(
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
    expect(collectViolationModulePaths(violations, ['domain-only-domain']).sort()).toEqual(
      ['src/App/App.tsx', 'src/Shared/index.ts', 'src/domain/a.ts', 'src/domain/b.ts'].sort(),
    );
  });

  it('returns all paths when rule names is empty', () => {
    expect(collectViolationModulePaths(violations, []).sort()).toEqual(collectViolationModulePaths(violations).sort());
  });

  it('filters violations whose from is not in sources', () => {
    expect(collectViolationModulePaths(violations, undefined, ['src/domain/a.ts', 'src/App/App.tsx']).sort()).toEqual(
      ['src/App/App.tsx', 'src/domain/a.ts'].sort(),
    );
  });

  it('combines rule name and sources filters', () => {
    expect(
      collectViolationModulePaths(violations, ['domain-only-domain'], ['src/domain/b.ts', 'src/Shared/index.ts']),
    ).toEqual(['src/domain/b.ts', 'src/Shared/index.ts']);
  });

  it('returns empty array when violations are missing', () => {
    expect(collectViolationModulePaths(undefined)).toEqual([]);
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
    expect(collectViolationModulePaths(selfViolation)).toEqual(['src/self.ts']);
  });
});
