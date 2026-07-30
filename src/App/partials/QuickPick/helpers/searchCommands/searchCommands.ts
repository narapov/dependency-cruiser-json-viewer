import fuzzysort from 'fuzzysort';

import type { QuickPickCommand } from '../../types';

/** Fuzzy-filters commands by label; empty query returns all commands. */
export function searchCommands(commands: QuickPickCommand[], query: string): QuickPickCommand[] {
  const trimmed = query.trim();

  if (!trimmed) {
    return commands;
  }

  return fuzzysort.go(trimmed, commands, { key: 'label' }).map(result => result.obj);
}
