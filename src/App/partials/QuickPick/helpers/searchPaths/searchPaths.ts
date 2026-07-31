import fuzzysort from 'fuzzysort';

import type { QuickPickFileItem } from '../../types';

/** Priority tiers that boost or demote path search ranking. */
export const PathSearchTier = {
  Src: 0,
  Lib: 1,
  Other: 2,
  NodeModules: 3,
} as const;

/** Numeric value of a path search ranking tier. */
export type PathSearchTier = (typeof PathSearchTier)[keyof typeof PathSearchTier];

const TIER_SCORE_MULTIPLIER: Record<PathSearchTier, number> = {
  [PathSearchTier.Src]: 100,
  [PathSearchTier.Lib]: 10,
  [PathSearchTier.Other]: 1,
  [PathSearchTier.NodeModules]: 0.01,
};

const MAX_RESULTS = 250;

function pathContainsSegment(key: string, segment: string): boolean {
  return key.split('/').includes(segment);
}

/** Maps a path to its ranking tier from path segments. */
export function getPathSearchTier(key: string): PathSearchTier {
  if (pathContainsSegment(key, 'node_modules')) {
    return PathSearchTier.NodeModules;
  }
  if (pathContainsSegment(key, 'src')) {
    return PathSearchTier.Src;
  }
  if (pathContainsSegment(key, 'lib')) {
    return PathSearchTier.Lib;
  }
  return PathSearchTier.Other;
}

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
        const multiplier = TIER_SCORE_MULTIPLIER[getPathSearchTier(result.obj.key)];
        return result.score * multiplier;
      },
    })
    .map(result => result.obj);
}
