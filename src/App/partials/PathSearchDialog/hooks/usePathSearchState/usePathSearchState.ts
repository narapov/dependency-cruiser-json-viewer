import { useDeferredValue, useMemo, useState } from 'react';

import { useCruiseTreeRequired } from '../../../../contexts';
import { buildSearchItems, searchPaths, type QuickPickFileItem } from '../../../QuickPick';

interface UsePathSearchStateConfig {
  /** When set, only these paths are searchable (e.g. module files without ancestor folders). */
  allowedPaths?: readonly string[];
}

/** Query and fuzzy file results for a titled path-search step. */
export function usePathSearchState(config: UsePathSearchStateConfig = {}) {
  const { allowedPaths } = config;

  const cruiseTree = useCruiseTreeRequired();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const allItems = useMemo(() => {
    const items = buildSearchItems(cruiseTree);
    if (allowedPaths == null) {
      return items;
    }

    const allowed = new Set(allowedPaths);
    return items.filter(item => allowed.has(item.key));
  }, [cruiseTree, allowedPaths]);

  const results: QuickPickFileItem[] = searchPaths(allItems, deferredQuery);

  return {
    query,
    setQuery,
    deferredQuery,
    results,
  };
}
