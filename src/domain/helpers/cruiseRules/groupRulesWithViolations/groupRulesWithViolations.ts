import type { IAnyRuleType, IFlattenedRuleSet, IViolation, SeverityType } from 'dependency-cruiser';

export interface RuleWithViolations {
  name: string;
  severity: SeverityType;
  rule: IAnyRuleType | null;
  violations: IViolation[];
}

interface NamedRuleEntry {
  name: string;
  severity: SeverityType;
  rule: IAnyRuleType;
}

function ruleName(rule: IAnyRuleType): string | undefined {
  return 'name' in rule && typeof rule.name === 'string' ? rule.name : undefined;
}

function ruleSeverity(rule: IAnyRuleType, fallback: SeverityType = 'warn'): SeverityType {
  return 'severity' in rule && rule.severity != null ? rule.severity : fallback;
}

/** Collect named rules from a flattened rule set in forbidden → allowed → required order. */
function collectNamedRules(ruleSet: IFlattenedRuleSet | undefined): NamedRuleEntry[] {
  if (ruleSet == null) {
    return [];
  }

  return [...(ruleSet.forbidden ?? []), ...(ruleSet.allowed ?? []), ...(ruleSet.required ?? [])].flatMap(rule => {
    const name = ruleName(rule);
    if (name == null) {
      return [];
    }
    return [{ name, severity: ruleSeverity(rule), rule }];
  });
}

/**
 * Group cruise-result rules with their violations, optionally limited to modules still in `sources`.
 */
export function groupRulesWithViolations(
  ruleSet: IFlattenedRuleSet | undefined,
  violations: readonly IViolation[] | undefined,
  sources?: readonly string[],
): RuleWithViolations[] {
  const sourceSet = sources == null ? null : new Set(sources);
  const visibleViolations = (violations ?? []).filter(violation => sourceSet == null || sourceSet.has(violation.from));

  const violationsByName = new Map<string, IViolation[]>();
  visibleViolations.forEach(violation => {
    const name = violation.rule.name;
    const existing = violationsByName.get(name);
    if (existing) {
      existing.push(violation);
    } else {
      violationsByName.set(name, [violation]);
    }
  });

  const namedRules = collectNamedRules(ruleSet);
  const seenNames = new Set(namedRules.map(entry => entry.name));

  const grouped: RuleWithViolations[] = namedRules.map(entry => ({
    name: entry.name,
    severity: entry.severity,
    rule: entry.rule,
    violations: violationsByName.get(entry.name) ?? [],
  }));

  const orphanNames = [...violationsByName.keys()].filter(name => !seenNames.has(name)).sort();

  return [
    ...grouped,
    ...orphanNames.map(name => {
      const ruleViolations = violationsByName.get(name) ?? [];
      return {
        name,
        severity: ruleViolations[0]?.rule.severity ?? 'warn',
        rule: null,
        violations: ruleViolations,
      };
    }),
  ];
}
