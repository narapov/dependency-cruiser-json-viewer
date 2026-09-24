import type { CruiseTreeSnapshot } from '@/domain';

import type { TreeNodeData } from '../../types';

/** Builds a nested file tree for the RichTreeView from a cruise tree snapshot. */
export function buildFileTree(snapshot: CruiseTreeSnapshot): TreeNodeData[] {
  const walk = (paths: readonly string[]): TreeNodeData[] =>
    paths.map(path => {
      const node = snapshot.nodes.get(path);
      if (node == null || !node.isFolder) {
        return {
          key: path,
          title: node?.name ?? path,
        };
      }

      return {
        key: path,
        title: node.name,
        children: walk([...node.childFolders, ...node.childFiles]),
      };
    });

  return walk(snapshot.rootPaths);
}
