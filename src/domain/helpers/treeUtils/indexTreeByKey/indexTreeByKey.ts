/**
 * Indexes every node in a forest into a Map keyed by a caller-supplied function.
 * Ancestors are nearest parent → … → root (empty at roots). Duplicate keys keep the last visit.
 */
export function indexTreeByKey<TNode extends { children?: readonly TNode[] }, TKey>(
  roots: readonly TNode[],
  getKey: (node: TNode, ancestors: readonly TNode[]) => TKey,
): Map<TKey, TNode> {
  const nodes = new Map<TKey, TNode>();

  const visit = (node: TNode, ancestors: readonly TNode[]) => {
    nodes.set(getKey(node, ancestors), node);
    const childAncestors = [node, ...ancestors];
    node.children?.forEach(child => {
      visit(child, childAncestors);
    });
  };

  roots.forEach(root => {
    visit(root, []);
  });

  return nodes;
}
