import { useDeferredValue, useMemo, useState } from 'react';

import { buildSearchItems, searchCommands, searchPaths } from '../../helpers';
import type { QuickPickCommand } from '../../types';

export function useQuickPickState(sources: string[], commands: QuickPickCommand[]) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const allItems = useMemo(() => buildSearchItems(sources), [sources]);

  const isCommandMode = query.startsWith('>');
  const commandQuery = isCommandMode ? query.slice(1).trim() : '';
  const deferredCommandQuery = useDeferredValue(commandQuery);

  const fileResults = isCommandMode ? [] : searchPaths(allItems, deferredQuery);
  const commandResults = isCommandMode ? searchCommands(commands, deferredCommandQuery) : [];
  const results = isCommandMode ? commandResults : fileResults;

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const openFileMode = () => {
    setQuery('');
    setOpen(true);
  };

  const openCommandMode = () => {
    setQuery('>');
    setOpen(true);
  };

  const toggleFileMode = () => {
    if (open) {
      close();
    } else {
      openFileMode();
    }
  };

  return {
    open,
    query,
    setQuery,
    deferredQuery,
    deferredCommandQuery,
    isCommandMode,
    fileResults,
    commandResults,
    results,
    close,
    openFileMode,
    openCommandMode,
    toggleFileMode,
  };
}
