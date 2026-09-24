import type { CruisePathNode, CruiseTreeSnapshot } from '../../../types';

/** Look up a path node in the cruise tree snapshot. */
export function getCruisePathNode(snapshot: CruiseTreeSnapshot, path: string): CruisePathNode | undefined {
  return snapshot.nodes.get(path);
}
