import type { IAnyRuleType, IFlattenedRuleSet, IViolation, SeverityType } from 'dependency-cruiser';

import { collectSourcesUnderFolder } from '../../pathUtils';
import type { RuleWithViolations } from '../groupRulesWithViolations';
import { isRuleApplicableToPath } from '../isRuleApplicableToPath';

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

/** Resolve module paths a panel path refers to (exact module, or sources under a folder). */
function resolveTargetPaths(path: string, moduleSources: readonly string[]): string[] {
  if (moduleSources.includes(path)) {
    return [path];
  }

  const underFolder = collectSourcesUnderFolder(path, moduleSources);
  if (underFolder.length > 0) {
    return underFolder;
  }

  return [path];
}

/**
 * Rules whose from/module path restrictions apply to `path`, with violations for that path (or folder subtree).
 */
export function getRulesApplicableToPath(
  path: string,
  ruleSet: IFlattenedRuleSet | undefined,
  violations: readonly IViolation[] | undefined,
  moduleSources: readonly string[] = [],
): RuleWithViolations[] {
  const targetPaths = resolveTargetPaths(path, moduleSources);
  const targetSet = new Set(targetPaths);

  const violationsByName = new Map<string, IViolation[]>();
  (violations ?? [])
    .filter(violation => targetSet.has(violation.from))
    .forEach(violation => {
      const name = violation.rule.name;
      const existing = violationsByName.get(name);
      if (existing) {
        existing.push(violation);
      } else {
        violationsByName.set(name, [violation]);
      }
    });

  return collectNamedRules(ruleSet)
    .filter(entry => targetPaths.some(target => isRuleApplicableToPath(entry.rule, target)))
    .map(entry => ({
      name: entry.name,
      severity: entry.severity,
      rule: entry.rule,
      violations: violationsByName.get(entry.name) ?? [],
    }));
}
