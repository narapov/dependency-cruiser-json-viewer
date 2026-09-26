import type { ICruiseResult } from 'dependency-cruiser';

import { buildCruiseTreeSnapshot, filterCruiseResult, type CruiseTreeSnapshot } from '@/domain';

export interface FilteredCruiseTree {
  cruiseResult: ICruiseResult;
  filtered: ICruiseResult;
  cruiseTree: CruiseTreeSnapshot;
}

/** Strip ignore matches and build the cruise tree for the remaining modules. */
export function buildFilteredCruiseTree(
  cruiseResult: ICruiseResult,
  ignorePatterns: readonly string[],
): FilteredCruiseTree {
  const filtered = filterCruiseResult(cruiseResult, [...ignorePatterns]);
  const cruiseTree = buildCruiseTreeSnapshot(
    filtered.modules,
    cruiseResult.summary.ruleSetUsed,
    cruiseResult.summary.violations,
  );
  return { cruiseResult, filtered, cruiseTree };
}
