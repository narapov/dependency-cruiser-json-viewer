import { getBaseName, type CruisePathNode, type CruiseSnapshot } from '@/domain';

import type { QuickPickFileItem } from '../../types';
import { getPathSearchTier } from '../pathSearchTier';

/** Builds sorted file and folder quick-pick items from a cruise snapshot. */
export function buildSearchItems(snapshot: CruiseSnapshot): QuickPickFileItem[] {
  const walk = (nodes: Iterable<CruisePathNode>): QuickPickFileItem[] =>
    [...nodes].flatMap(node => {
      const item: QuickPickFileItem = {
        key: node.path,
        name: getBaseName(node.path),
        isFolder: node.isFolder,
        parent: node.parent,
        tier: getPathSearchTier(node.path, node.ancestors),
      };
      return node.isFolder ? [item, ...walk(node.children.values())] : [item];
    });

  return walk(snapshot.tree.values());
}
