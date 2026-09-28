import type { CruiseSnapshot } from '../../../types';

/** Derive fully-selected folder ancestors for UI from a file-only selection. */
export function expandSelectionWithSelectedAncestors(
  selectedPaths: readonly string[],
  cruiseSnapshot: CruiseSnapshot,
): string[] {
  const selected = new Set(selectedPaths);

  [...cruiseSnapshot.nodes.values()]
    .filter(node => node.isFolder)
    .forEach(node => {
      const { descendantFiles } = node;
      if (descendantFiles.size > 0 && [...descendantFiles].every(file => selected.has(file))) {
        selected.add(node.path);
      }
    });

  return [...selected];
}
