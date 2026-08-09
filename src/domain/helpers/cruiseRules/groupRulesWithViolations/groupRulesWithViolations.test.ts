import type { IFlattenedRuleSet, IViolation } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { groupRulesWithViolations } from './groupRulesWithViolations';

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
  ],
  allowed: [{ from: {}, to: {} }],
  required: [
    {
      name: 'must-have-index',
      severity: 'warn',
      module: { path: '^src/' },
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
    rule: { name: 'not-in-allowed', severity: 'warn' },
    from: 'src/orphan.ts',
    to: 'src/other.ts',
  },
];

describe('groupRulesWithViolations', () => {
  it('groups violations by rule name in forbidden → allowed → required order', () => {
    const result = groupRulesWithViolations(ruleSet, violations);

    expect(result.map(entry => entry.name)).toEqual([
      'no-circular',
      'domain-only-domain',
      'must-have-index',
      'not-in-allowed',
    ]);
    expect(result[0]?.violations).toHaveLength(0);
    expect(result[1]?.violations).toHaveLength(2);
    expect(result[2]?.violations).toHaveLength(0);
    expect(result[3]?.rule).toBeNull();
    expect(result[3]?.violations).toHaveLength(1);
  });

  it('returns named rules with empty violations when violations are missing', () => {
    const result = groupRulesWithViolations(ruleSet, undefined);

    expect(result).toHaveLength(3);
    expect(result.every(entry => entry.violations.length === 0)).toBe(true);
  });

  it('filters violations whose from is not in sources', () => {
    const result = groupRulesWithViolations(ruleSet, violations, ['src/domain/a.ts', 'src/App/App.tsx']);

    const domainRule = result.find(entry => entry.name === 'domain-only-domain');
    expect(domainRule?.violations).toHaveLength(1);
    expect(domainRule?.violations[0]?.from).toBe('src/domain/a.ts');
    expect(result.find(entry => entry.name === 'not-in-allowed')).toBeUndefined();
  });

  it('returns an empty list when rule set and violations are missing', () => {
    expect(groupRulesWithViolations(undefined, undefined)).toEqual([]);
  });
});
