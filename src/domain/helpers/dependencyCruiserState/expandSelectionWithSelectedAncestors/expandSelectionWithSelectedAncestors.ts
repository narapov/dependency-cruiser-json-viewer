import { getAncestorKeys } from '../../pathUtils';

/** Expand a file selection with folder ancestors whose every source descendant is selected. */
export function expandSelectionWithSelectedAncestors(selectedPaths: string[], sources: string[]): string[] {
  const selected = new Set(selectedPaths);
  const folders = [...new Set(sources.flatMap(source => getAncestorKeys(source)))].sort(
    (a, b) => b.length - a.length || b.localeCompare(a),
  );

  for (const folder of folders) {
    const filesUnder = sources.filter(source => source.startsWith(`${folder}/`));
    if (filesUnder.length > 0 && filesUnder.every(file => selected.has(file))) {
      selected.add(folder);
    }
  }

  return [...selected];
}
