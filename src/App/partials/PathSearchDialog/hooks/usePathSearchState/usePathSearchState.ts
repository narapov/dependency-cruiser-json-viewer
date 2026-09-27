import { useDeferredValue, useMemo, useState } from 'react';

import { useCruiseSnapshotRequired } from '../../../../contexts';
import { buildSearchItems, searchPaths, type QuickPickFileItem } from '../../../QuickPick';

interface UsePathSearchStateConfig {
  /** When set, only these paths are searchable (e.g. module files without ancestor folders). */
  allowedPaths?: readonly string[];
}

/** Query and fuzzy file results for a titled path-search step. */
export function usePathSearchState(config: UsePathSearchStateConfig = {}) {
  const { allowedPaths } = config;

  const cruiseSnapshot = useCruiseSnapshotRequired();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const allItems = useMemo(() => {
    const items = buildSearchItems(cruiseSnapshot);
    if (allowedPaths == null) {
      return items;
    }

    const allowed = new Set(allowedPaths);
    return items.filter(item => allowed.has(item.key));
  }, [cruiseSnapshot, allowedPaths]);

  const results: QuickPickFileItem[] = searchPaths(allItems, deferredQuery);

  return {
    query,
    setQuery,
    deferredQuery,
    results,
  };
}
