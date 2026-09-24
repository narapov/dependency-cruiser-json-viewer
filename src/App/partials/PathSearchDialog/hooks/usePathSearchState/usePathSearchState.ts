import { useDeferredValue, useMemo, useState } from 'react';

import { buildSearchItems, searchPaths, type QuickPickFileItem } from '../../../QuickPick';

interface UsePathSearchStateConfig {
  sources: string[];
  /** When true, only exact `sources` paths are searchable (no ancestor folders). */
  exactSourcesOnly?: boolean;
}

/** Query and fuzzy file results for a titled path-search step. */
export function usePathSearchState(config: UsePathSearchStateConfig) {
  const { sources, exactSourcesOnly = false } = config;

  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const allItems = useMemo(() => {
    const items = buildSearchItems(sources);
    if (!exactSourcesOnly) {
      return items;
    }

    const allowed = new Set(sources);
    return items.filter(item => allowed.has(item.key));
  }, [sources, exactSourcesOnly]);

  const results: QuickPickFileItem[] = searchPaths(allItems, deferredQuery);

  return {
    query,
    setQuery,
    deferredQuery,
    results,
  };
}
