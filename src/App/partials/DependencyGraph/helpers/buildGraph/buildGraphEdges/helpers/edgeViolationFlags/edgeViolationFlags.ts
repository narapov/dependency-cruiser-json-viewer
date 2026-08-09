import type { IDependency } from 'dependency-cruiser';

/** Rule severities that affect graph edge styling. */
export type EdgeViolationSeverity = 'error' | 'warn';

/** Aggregated violation flags for a visible graph edge. */
export interface EdgeViolationFlags {
  couldNotResolve: boolean;
  severity: EdgeViolationSeverity | null;
  ruleNames: Set<string>;
}

function severityFromRules(rules: NonNullable<IDependency['rules']>): EdgeViolationSeverity | null {
  if (rules.some(rule => rule.severity === 'error')) {
    return 'error';
  }
  if (rules.some(rule => rule.severity === 'warn')) {
    return 'warn';
  }
  return null;
}

/** Create violation flags from a single dependency. */
export function createEdgeViolationFlags(dep: Pick<IDependency, 'couldNotResolve' | 'rules'>): EdgeViolationFlags {
  const rules = (dep.rules ?? []).filter(rule => rule.severity === 'error' || rule.severity === 'warn');
  return {
    couldNotResolve: dep.couldNotResolve === true,
    severity: severityFromRules(rules),
    ruleNames: new Set(rules.map(rule => rule.name)),
  };
}

/** Prefer error over warn when merging severities. */
export function mergeViolationSeverity(
  current: EdgeViolationSeverity | null,
  next: EdgeViolationSeverity | null,
): EdgeViolationSeverity | null {
  if (current === 'error' || next === 'error') {
    return 'error';
  }
  if (current === 'warn' || next === 'warn') {
    return 'warn';
  }
  return null;
}

/** Merge another dependency's violation flags into an existing edge flags object. */
export function mergeEdgeViolationFlags(flags: EdgeViolationFlags, next: EdgeViolationFlags): void {
  flags.couldNotResolve = flags.couldNotResolve || next.couldNotResolve;
  flags.severity = mergeViolationSeverity(flags.severity, next.severity);
  next.ruleNames.forEach(name => {
    flags.ruleNames.add(name);
  });
}
