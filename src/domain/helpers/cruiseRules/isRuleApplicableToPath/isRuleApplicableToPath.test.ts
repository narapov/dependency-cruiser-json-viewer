import type { IAnyRuleType } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { isRuleApplicableToPath } from './isRuleApplicableToPath';

describe('isRuleApplicableToPath', () => {
  it('matches empty from against any module', () => {
    const rule: IAnyRuleType = { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } };
    expect(isRuleApplicableToPath(rule, 'src/anything.ts')).toBe(true);
  });

  it('matches forbidden from.path', () => {
    const rule: IAnyRuleType = {
      name: 'domain-only',
      severity: 'error',
      from: { path: '^src/domain/' },
      to: { pathNot: '^src/domain/' },
    };
    expect(isRuleApplicableToPath(rule, 'src/domain/a.ts')).toBe(true);
    expect(isRuleApplicableToPath(rule, 'src/App/a.ts')).toBe(false);
  });

  it('matches required module.path', () => {
    const rule: IAnyRuleType = {
      name: 'must-have-index',
      severity: 'warn',
      module: { path: '^src/App/' },
      to: { path: 'index\\.ts$' },
    };
    expect(isRuleApplicableToPath(rule, 'src/App/a.ts')).toBe(true);
    expect(isRuleApplicableToPath(rule, 'src/domain/a.ts')).toBe(false);
  });

  it('matches dependents-forbidden module.path', () => {
    const rule: IAnyRuleType = {
      name: 'no-orphans',
      severity: 'warn',
      module: { path: '^src/', pathNot: '\\.d\\.ts$' },
      from: {},
    };
    expect(isRuleApplicableToPath(rule, 'src/a.ts')).toBe(true);
    expect(isRuleApplicableToPath(rule, 'src/a.d.ts')).toBe(false);
  });
});
