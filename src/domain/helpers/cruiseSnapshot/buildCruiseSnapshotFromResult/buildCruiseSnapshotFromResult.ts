import type { ICruiseResult } from 'dependency-cruiser';

import type { CruiseSnapshot } from '../../../types';
import { filterCruiseResult } from '../../cruiseResult';
import { collectDistinctCycles } from '../../dependencyUtils';
import { buildCruiseSnapshot } from '../buildCruiseSnapshot';

/**
 * Filter a cruise result by ignore patterns and build a snapshot whose cycles
 * come from the unfiltered modules (members absent after filter are marked ignored).
 */
export function buildCruiseSnapshotFromResult(
  cruiseResult: ICruiseResult,
  ignorePatterns: readonly string[] = [],
): CruiseSnapshot {
  const filtered = filterCruiseResult(cruiseResult, [...ignorePatterns]);
  const presentSources = new Set(filtered.modules.map(module => module.source));
  const cycles = collectDistinctCycles(cruiseResult.modules, presentSources);

  return buildCruiseSnapshot(
    filtered.modules,
    cruiseResult.summary.ruleSetUsed,
    cruiseResult.summary.violations,
    cycles,
  );
}
