import { getBaseName, type CruiseSnapshot, type VisibleTreeNode } from '@/domain';

import type { VisibleTreeLayoutedNode } from '../../../types';
import { getLeafNodeSize } from '../../getLeafNodeSize';

/** Clone a visible-tree node into a layouted node with leaf sizes (groups sized later). */
function createLayoutedNode(node: VisibleTreeNode, cruiseSnapshot: CruiseSnapshot): VisibleTreeLayoutedNode {
  if (node.children) {
    return {
      path: node.path,
      valueCircular: node.valueCircular,
      typeOnlyCircular: node.typeOnlyCircular,
      children: node.children.map(child => createLayoutedNode(child, cruiseSnapshot)),
      position: { x: 0, y: 0 },
      width: 0,
      height: 0,
    };
  }

  const isFolder = Boolean(cruiseSnapshot.nodes.get(node.path)?.isFolder);
  const size = getLeafNodeSize(getBaseName(node.path), isFolder ? 'folder' : 'file');

  return {
    path: node.path,
    valueCircular: node.valueCircular,
    typeOnlyCircular: node.typeOnlyCircular,
    position: { x: 0, y: 0 },
    width: size.width,
    height: size.height,
  };
}

/** Clone a visible tree into layouted roots with leaf geometry. */
export function createLayoutedTree(
  visibleTree: readonly VisibleTreeNode[],
  cruiseSnapshot: CruiseSnapshot,
): VisibleTreeLayoutedNode[] {
  return visibleTree.map(node => createLayoutedNode(node, cruiseSnapshot));
}
