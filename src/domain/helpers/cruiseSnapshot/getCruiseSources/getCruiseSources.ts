import type { CruiseSnapshot } from '../../../types';

/**
 * All file module paths in the cruise snapshot (non-folder nodes).
 */
export function getCruiseSources(snapshot: CruiseSnapshot): string[] {
  return [...snapshot.nodes.values()].filter(node => !node.isFolder).map(node => node.path);
}
