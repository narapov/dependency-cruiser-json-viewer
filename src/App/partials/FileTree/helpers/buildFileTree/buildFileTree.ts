import { getBaseName, type CruisePathNode, type CruiseSnapshot } from '@/domain';

import type { TreeNodeData } from '../../types';

/** Maps the precomputed cruise hierarchy to RichTreeView node data. */
export function buildFileTree(snapshot: CruiseSnapshot): TreeNodeData[] {
  console.log('building file tree');
  const mapNode = (node: CruisePathNode): TreeNodeData => {
    return {
      key: node.path,
      title: getBaseName(node.path),
      children: node.isFolder ? [...node.children.values()].map(mapNode) : undefined,
    };
  };

  return [...snapshot.tree.values()].map(mapNode);
}
