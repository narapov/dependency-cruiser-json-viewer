import type { IFlattenedRuleSet, IViolation } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { getRulesApplicableToPath } from './getRulesApplicableToPath';

const ruleSet: IFlattenedRuleSet = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'domain-only-domain',
      severity: 'error',
      from: { path: '^src/domain/' },
      to: { pathNot: '^src/domain/' },
    },
    {
      name: 'app-only',
      severity: 'error',
      from: { path: '^src/App/' },
      to: { pathNot: '^src/App/' },
    },
  ],
  required: [
    {
      name: 'must-have-index',
      severity: 'warn',
      module: { path: '^src/domain/' },
      to: { path: 'index\\.ts$' },
    },
  ],
};

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
    type: 'dependency',
    rule: { name: 'app-only', severity: 'error' },
    from: 'src/App/leak.ts',
    to: 'src/domain/x.ts',
  },
];

describe('getRulesApplicableToPath', () => {
  it('returns rules applicable to a module path with its violations', () => {
    const result = getRulesApplicableToPath('src/domain/a.ts', ruleSet, violations, [
      'src/domain/a.ts',
      'src/domain/b.ts',
      'src/App/leak.ts',
    ]);

    expect(result.map(entry => entry.name)).toEqual(['no-circular', 'domain-only-domain', 'must-have-index']);
    expect(result.find(entry => entry.name === 'domain-only-domain')?.violations).toEqual([violations[0]]);
    expect(result.find(entry => entry.name === 'app-only')).toBeUndefined();
  });

  it('unions applicable rules for a folder path', () => {
    const result = getRulesApplicableToPath('src/domain', ruleSet, violations, [
      'src/domain/a.ts',
      'src/domain/b.ts',
      'src/App/leak.ts',
    ]);

    expect(result.map(entry => entry.name)).toEqual(['no-circular', 'domain-only-domain', 'must-have-index']);
    expect(result.find(entry => entry.name === 'domain-only-domain')?.violations).toHaveLength(2);
  });

  it('returns empty when rule set is missing', () => {
    expect(getRulesApplicableToPath('src/domain/a.ts', undefined, violations)).toEqual([]);
  });

  it('matches against the path string when it is not in moduleSources', () => {
    const result = getRulesApplicableToPath('src/App/x.ts', ruleSet, undefined, []);
    expect(result.map(entry => entry.name)).toEqual(['no-circular', 'app-only']);
  });
});
