import type { IViolation } from 'dependency-cruiser';

/**
 * Collect unique module paths involved in violations, optionally limited to rule names and visible sources.
 *
 * @example
 * collectViolationModulePaths(violations, ['no-circular'], sources)
 */
export function collectViolationModulePaths(
  violations: readonly IViolation[] | undefined,
  ruleNames?: readonly string[],
  sources?: readonly string[],
): string[] {
  const sourceSet = sources == null ? null : new Set(sources);
  const ruleNameSet = ruleNames == null || ruleNames.length === 0 ? null : new Set(ruleNames);

  return [
    ...new Set(
      (violations ?? []).flatMap(violation => {
        if (sourceSet != null && !sourceSet.has(violation.from)) {
          return [];
        }
        if (ruleNameSet != null && !ruleNameSet.has(violation.rule.name)) {
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
