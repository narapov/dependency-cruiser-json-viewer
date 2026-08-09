import type { IDependency } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { createEdgeViolationFlags, mergeEdgeViolationFlags, mergeViolationSeverity } from './edgeViolationFlags';

describe('createEdgeViolationFlags', () => {
  it('reads couldNotResolve and error/warn rules', () => {
    const flags = createEdgeViolationFlags({
      couldNotResolve: true,
      rules: [
        { name: 'shared-only', severity: 'error' },
        { name: 'no-orphans', severity: 'warn' },
        { name: 'info-rule', severity: 'info' },
      ],
    } as Pick<IDependency, 'couldNotResolve' | 'rules'>);

    expect(flags.couldNotResolve).toBe(true);
    expect(flags.severity).toBe('error');
    expect([...flags.ruleNames].sort()).toEqual(['no-orphans', 'shared-only']);
  });

  it('returns warn severity when only warn rules are present', () => {
    const flags = createEdgeViolationFlags({
      couldNotResolve: false,
      rules: [{ name: 'not-in-allowed', severity: 'warn' }],
    } as Pick<IDependency, 'couldNotResolve' | 'rules'>);

    expect(flags.severity).toBe('warn');
  });
});

describe('mergeViolationSeverity', () => {
  it('prefers error over warn', () => {
    expect(mergeViolationSeverity('warn', 'error')).toBe('error');
    expect(mergeViolationSeverity('error', 'warn')).toBe('error');
    expect(mergeViolationSeverity(null, 'warn')).toBe('warn');
  });
});

describe('mergeEdgeViolationFlags', () => {
  it('ors couldNotResolve and unions rule names', () => {
    const flags = createEdgeViolationFlags({
      couldNotResolve: false,
      rules: [{ name: 'a', severity: 'warn' }],
    } as Pick<IDependency, 'couldNotResolve' | 'rules'>);

    mergeEdgeViolationFlags(
      flags,
      createEdgeViolationFlags({
        couldNotResolve: true,
        rules: [{ name: 'b', severity: 'error' }],
      } as Pick<IDependency, 'couldNotResolve' | 'rules'>),
    );

    expect(flags.couldNotResolve).toBe(true);
    expect(flags.severity).toBe('error');
    expect([...flags.ruleNames].sort()).toEqual(['a', 'b']);
  });
});
