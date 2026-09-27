import type { CruiseSnapshot, HierarchicalNode } from '@/domain';

import type { TreeNodeData } from '../../types';

/** Maps the precomputed cruise hierarchy to RichTreeView node data. */
export function buildFileTree(snapshot: CruiseSnapshot): TreeNodeData[] {
  const mapNode = (node: HierarchicalNode): TreeNodeData => {
    const title = snapshot.nodes.get(node.path)?.name ?? node.path;
    return {
      key: node.path,
      title,
      children: node.children?.map(mapNode),
    };
  };

  return snapshot.tree.map(mapNode);
}
