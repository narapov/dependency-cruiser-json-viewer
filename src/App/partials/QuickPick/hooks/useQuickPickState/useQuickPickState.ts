import { useDeferredValue, useMemo, useState } from 'react';

import { useWorkspaceStore } from '../../../../stores/workspaceStore';
import { buildSearchItems, searchCommands, searchPaths } from '../../helpers';
import type { QuickPickCommand } from '../../types';

export function useQuickPickState(commands: QuickPickCommand[], recentCommandIds: string[] = []) {
  const cruiseSnapshot = useWorkspaceStore(state => state.cruiseSnapshot);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const allItems = useMemo(() => buildSearchItems(cruiseSnapshot), [cruiseSnapshot]);

  const isCommandMode = query.startsWith('>');
  const normalizedQuery = isCommandMode ? query.slice(1).trim() : query;
  const normalizedDeferredQuery = useDeferredValue(normalizedQuery);

  const fileResults = isCommandMode ? [] : searchPaths(allItems, normalizedDeferredQuery);
  const commandResults = isCommandMode ? searchCommands(commands, normalizedDeferredQuery, recentCommandIds) : [];
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
    normalizedQuery,
    normalizedDeferredQuery,
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
