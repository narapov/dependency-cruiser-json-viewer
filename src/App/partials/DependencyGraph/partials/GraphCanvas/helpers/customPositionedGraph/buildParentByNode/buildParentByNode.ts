import type { VisibleTreeLayoutedNode } from '../../../types';

/** Builds parent id lookup from visible-tree roots (null = viewport root). */
export function buildParentByNode(roots: readonly VisibleTreeLayoutedNode[]): Map<string, string | null> {
  const parentByNode = new Map<string, string | null>();

  const visit = (nodes: readonly VisibleTreeLayoutedNode[], parentId: string | null) => {
    nodes.forEach(node => {
      parentByNode.set(node.path, parentId);
      if (node.children) {
        visit(node.children, node.path);
      }
    });
  };

  visit(roots, null);
  return parentByNode;
}
