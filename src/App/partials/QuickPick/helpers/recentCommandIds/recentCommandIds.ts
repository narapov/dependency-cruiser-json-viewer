import { appStorageKey } from '@/Shared';

import type { QuickPickCommand } from '../../types';

/** localStorage key for the MRU command id queue. */
export const RECENT_COMMANDS_STORAGE_KEY = appStorageKey('recent-commands');

/** Maximum number of recent command ids kept in the queue. */
export const MAX_RECENT_COMMANDS = 25;

/** Move `id` to the front of the queue, remove duplicates, and cap length. */
export function pushRecentCommandId(ids: string[], id: string): string[] {
  return [id, ...ids.filter(existing => existing !== id)].slice(0, MAX_RECENT_COMMANDS);
}

/** Read the recent command id queue from localStorage; corrupt data yields `[]`. */
export function readRecentCommandIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_COMMANDS_STORAGE_KEY);
    if (raw === null) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(item => typeof item === 'string')) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

/** Persist the recent command id queue to localStorage. */
export function writeRecentCommandIds(ids: string[]): void {
  localStorage.setItem(RECENT_COMMANDS_STORAGE_KEY, JSON.stringify(ids));
}

/**
 * Order commands by recent usage: known recent ids first (queue order),
 * then the remaining commands in their original order.
 */
export function sortCommandsByRecentUsage(commands: QuickPickCommand[], recentIds: string[]): QuickPickCommand[] {
  const byId = new Map(commands.map(command => [command.id, command]));
  const recent: QuickPickCommand[] = [];
  const seen = new Set<string>();

  recentIds.forEach(id => {
    const command = byId.get(id);
    if (command === undefined || seen.has(id)) {
      return;
    }
    seen.add(id);
    recent.push(command);
  });

  const rest = commands.filter(command => !seen.has(command.id));
  return [...recent, ...rest];
}
