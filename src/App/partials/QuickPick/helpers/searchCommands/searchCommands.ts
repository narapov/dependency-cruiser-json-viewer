import fuzzysort from 'fuzzysort';

import type { QuickPickCommand } from '../../types';
import { sortCommandsByRecentUsage } from '../recentCommandIds';

/** Fuzzy-filters commands by label; empty query returns commands sorted by recent usage. */
export function searchCommands(
  commands: QuickPickCommand[],
  query: string,
  recentIds: string[] = [],
): QuickPickCommand[] {
  const trimmed = query.trim();

  if (!trimmed) {
    return sortCommandsByRecentUsage(commands, recentIds);
  }

  return fuzzysort.go(trimmed, commands, { key: 'label', threshold: 0, limit: 0 }).map(result => result.obj);
}
