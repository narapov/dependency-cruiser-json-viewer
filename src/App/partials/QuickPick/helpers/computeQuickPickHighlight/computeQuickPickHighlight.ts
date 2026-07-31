import fuzzysort from 'fuzzysort';

/** Character indexes to highlight in a quick-pick item's name and path. */
export interface QuickPickHighlight {
  nameIndexes: number[];
  pathIndexes: number[];
}

/** Fuzzy-matches a query against name and path, returning highlight indexes. */
export function computeQuickPickHighlight(query: string, name: string, key: string): QuickPickHighlight {
  const trimmed = query.trim();
  if (!trimmed) {
    return { nameIndexes: [], pathIndexes: [] };
  }

  const nameResult = fuzzysort.single(trimmed, name);
  const keyResult = fuzzysort.single(trimmed, key);
  const lastSlash = key.lastIndexOf('/');

  const pathIndexes = lastSlash !== -1 && keyResult ? keyResult.indexes.filter(index => index < lastSlash) : [];

  let nameIndexes: number[] = [];
  if (nameResult) {
    nameIndexes = [...nameResult.indexes];
  } else if (keyResult) {
    if (lastSlash === -1) {
      nameIndexes = [...keyResult.indexes];
    } else {
      nameIndexes = keyResult.indexes.filter(index => index > lastSlash).map(index => index - lastSlash - 1);
    }
  }

  return { nameIndexes, pathIndexes };
}
