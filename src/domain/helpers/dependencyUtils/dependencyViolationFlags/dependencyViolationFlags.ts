import type { IDependency } from 'dependency-cruiser';

/** Rule severities that affect dependency violation aggregation. */
export type DependencyViolationSeverity = 'error' | 'warn';

/** Aggregated violation flags for a dependency relation. */
export interface DependencyViolationFlags {
  couldNotResolve: boolean;
  severity: DependencyViolationSeverity | null;
  ruleNames: Set<string>;
}

function severityFromRules(rules: NonNullable<IDependency['rules']>): DependencyViolationSeverity | null {
  if (rules.some(rule => rule.severity === 'error')) {
    return 'error';
  }
  if (rules.some(rule => rule.severity === 'warn')) {
    return 'warn';
  }
  return null;
}

/** Create violation flags from a single dependency. */
export function createDependencyViolationFlags(
  dep: Pick<IDependency, 'couldNotResolve' | 'rules'>,
): DependencyViolationFlags {
  const rules = (dep.rules ?? []).filter(rule => rule.severity === 'error' || rule.severity === 'warn');
  return {
    couldNotResolve: dep.couldNotResolve === true,
    severity: severityFromRules(rules),
    ruleNames: new Set(rules.map(rule => rule.name)),
  };
}

/** Prefer error over warn when merging severities. */
export function mergeViolationSeverity(
  current: DependencyViolationSeverity | null,
  next: DependencyViolationSeverity | null,
): DependencyViolationSeverity | null {
  if (current === 'error' || next === 'error') {
    return 'error';
  }
  if (current === 'warn' || next === 'warn') {
    return 'warn';
  }
  return null;
}

/** Merge another dependency's violation flags into an existing flags object. */
export function mergeDependencyViolationFlags(flags: DependencyViolationFlags, next: DependencyViolationFlags): void {
  flags.couldNotResolve = flags.couldNotResolve || next.couldNotResolve;
  flags.severity = mergeViolationSeverity(flags.severity, next.severity);
  next.ruleNames.forEach(name => {
    flags.ruleNames.add(name);
  });
}
