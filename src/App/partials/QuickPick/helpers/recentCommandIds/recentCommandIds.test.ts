// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import type { QuickPickCommand } from '../../types';
import {
  MAX_RECENT_COMMANDS,
  pushRecentCommandId,
  readRecentCommandIds,
  RECENT_COMMANDS_STORAGE_KEY,
  sortCommandsByRecentUsage,
  writeRecentCommandIds,
} from './recentCommandIds';

function command(id: string, label: string): QuickPickCommand {
  return { id, label, onExecute: () => {} };
}

describe('pushRecentCommandId', () => {
  it('prepends id and removes duplicates', () => {
    expect(pushRecentCommandId(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c']);
  });

  it('caps the queue at MAX_RECENT_COMMANDS', () => {
    const ids = Array.from({ length: MAX_RECENT_COMMANDS }, (_, index) => `id-${index}`);
    const next = pushRecentCommandId(ids, 'newest');

    expect(next).toHaveLength(MAX_RECENT_COMMANDS);
    expect(next[0]).toBe('newest');
    expect(next.at(-1)).toBe(`id-${MAX_RECENT_COMMANDS - 2}`);
  });
});

describe('readRecentCommandIds / writeRecentCommandIds', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('round-trips a string array', () => {
    writeRecentCommandIds(['setTheme', 'about']);
    expect(readRecentCommandIds()).toEqual(['setTheme', 'about']);
    expect(localStorage.getItem(RECENT_COMMANDS_STORAGE_KEY)).toBe(JSON.stringify(['setTheme', 'about']));
  });

  it('returns empty array for missing, corrupt, or non-string data', () => {
    expect(readRecentCommandIds()).toEqual([]);

    localStorage.setItem(RECENT_COMMANDS_STORAGE_KEY, 'not-json');
    expect(readRecentCommandIds()).toEqual([]);

    localStorage.setItem(RECENT_COMMANDS_STORAGE_KEY, JSON.stringify({ id: 'x' }));
    expect(readRecentCommandIds()).toEqual([]);

    localStorage.setItem(RECENT_COMMANDS_STORAGE_KEY, JSON.stringify(['ok', 1]));
    expect(readRecentCommandIds()).toEqual([]);
  });
});

describe('sortCommandsByRecentUsage', () => {
  const commands = [command('about', 'About'), command('selectAll', 'Select All'), command('setTheme', 'Set Theme')];

  it('returns original order when recent ids are empty', () => {
    expect(sortCommandsByRecentUsage(commands, []).map(item => item.id)).toEqual(['about', 'selectAll', 'setTheme']);
  });

  it('puts known recent ids first in queue order and skips unknown ids', () => {
    expect(sortCommandsByRecentUsage(commands, ['setTheme', 'missing', 'about']).map(item => item.id)).toEqual([
      'setTheme',
      'about',
      'selectAll',
    ]);
  });
});
