import type { IAnyRuleType } from 'dependency-cruiser';

import { matchesPathRestriction } from '../matchesPathRestriction';

function restrictionMatches(
  modulePath: string,
  restriction: { path?: string | string[]; pathNot?: string | string[] },
): boolean {
  return matchesPathRestriction(modulePath, restriction.path, restriction.pathNot);
}

/**
 * Whether a cruise rule's from/module path restrictions apply to `modulePath`.
 * Empty from/module restrictions match every module.
 */
export function isRuleApplicableToPath(rule: IAnyRuleType, modulePath: string): boolean {
  if ('module' in rule && rule.module != null) {
    return restrictionMatches(modulePath, rule.module);
  }

  if ('from' in rule && rule.from != null) {
    return restrictionMatches(modulePath, rule.from);
  }

  return false;
}
