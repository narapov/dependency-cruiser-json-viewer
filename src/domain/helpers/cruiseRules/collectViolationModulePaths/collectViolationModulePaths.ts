import type { IViolation } from 'dependency-cruiser';

/**
 * Collect unique module paths involved in snapshot violations, optionally limited to rule names.
 *
 * @example
 * collectViolationModulePaths(snapshot.violations, ['no-circular'])
 */
export function collectViolationModulePaths(
  violations: ReadonlyMap<string, readonly IViolation[]>,
  ruleNames?: readonly string[],
): string[] {
  const ruleNameSet = !ruleNames || ruleNames.length === 0 ? null : new Set(ruleNames);

  return [
    ...new Set(
      [...violations.values()].flat().flatMap(violation => {
        if (ruleNameSet && !ruleNameSet.has(violation.rule.name)) {
          return [];
        }
        if (violation.to && violation.to !== violation.from) {
          return [violation.from, violation.to];
        }
        return [violation.from];
      }),
    ),
  ];
}
