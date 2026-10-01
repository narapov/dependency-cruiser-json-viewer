import fuzzysort from 'fuzzysort';

import type { QuickPickFileItem } from '../../types';
import { PathSearchTier } from '../pathSearchTier';

export { getPathSearchTier, PathSearchTier } from '../pathSearchTier';

const TIER_SCORE_MULTIPLIER: Record<(typeof PathSearchTier)[keyof typeof PathSearchTier], number> = {
  [PathSearchTier.Src]: 100,
  [PathSearchTier.Lib]: 10,
  [PathSearchTier.Other]: 1,
  [PathSearchTier.NodeModules]: 0.01,
};

const MAX_RESULTS = 250;

/** Fuzzy-searches paths with tier-weighted scores; empty query returns none. */
export function searchPaths(items: QuickPickFileItem[], query: string): QuickPickFileItem[] {
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  return fuzzysort
    .go(trimmed, items, {
      keys: ['name', 'key'],
      limit: MAX_RESULTS,
      scoreFn: result => {
        const multiplier = TIER_SCORE_MULTIPLIER[result.obj.tier];
        return result.score * multiplier;
      },
    })
    .map(result => result.obj);
}
