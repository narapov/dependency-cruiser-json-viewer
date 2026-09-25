import type { CruiseTreeSnapshot } from '@/domain';

import type { QuickPickFileItem } from '../../types';

/** Builds sorted file and folder quick-pick items from a cruise tree snapshot. */
export function buildSearchItems(snapshot: CruiseTreeSnapshot): QuickPickFileItem[] {
  const walk = (paths: readonly string[]): QuickPickFileItem[] =>
    paths.flatMap(path => {
      const node = snapshot.nodes.get(path);
      if (node == null) {
        return [];
      }
      const item: QuickPickFileItem = {
        key: path,
        name: node.name,
        isFolder: node.isFolder,
      };
      return node.isFolder ? [item, ...walk(node.childPaths)] : [item];
    });

  return walk(snapshot.rootPaths);
}
