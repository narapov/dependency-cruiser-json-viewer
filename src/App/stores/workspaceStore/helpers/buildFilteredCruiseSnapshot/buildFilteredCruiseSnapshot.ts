import type { ICruiseResult } from 'dependency-cruiser';

import { buildCruiseSnapshot, filterCruiseResult, type CruiseSnapshot } from '@/domain';

export interface FilteredCruiseSnapshot {
  cruiseResult: ICruiseResult;
  filteredCruiseResult: ICruiseResult;
  cruiseSnapshot: CruiseSnapshot;
}

/** Strip ignore matches and build the cruise snapshot for the remaining modules. */
export function buildFilteredCruiseSnapshot(
  cruiseResult: ICruiseResult,
  ignorePatterns: readonly string[],
): FilteredCruiseSnapshot {
  const filteredCruiseResult = filterCruiseResult(cruiseResult, [...ignorePatterns]);
  const cruiseSnapshot = buildCruiseSnapshot(
    filteredCruiseResult.modules,
    cruiseResult.summary.ruleSetUsed,
    cruiseResult.summary.violations,
  );
  return { cruiseResult, filteredCruiseResult, cruiseSnapshot };
}
