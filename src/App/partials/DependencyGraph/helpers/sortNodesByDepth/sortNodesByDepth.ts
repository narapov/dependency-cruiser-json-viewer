import type { Node } from '@xyflow/react';

export function sortNodesByDepth(nodes: readonly Node[]): Node[] {
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const depthById = new Map<string, number>();

  function getDepth(id: string): number {
    const cached = depthById.get(id);
    if (cached !== undefined) return cached;

    const node = nodeById.get(id);
    if (!node?.parentId) {
      depthById.set(id, 0);
      return 0;
    }

    const depth = getDepth(node.parentId) + 1;
    depthById.set(id, depth);
    return depth;
  }

  for (const node of nodes) {
    getDepth(node.id);
  }

  return [...nodes].sort((a, b) => (depthById.get(a.id) ?? 0) - (depthById.get(b.id) ?? 0));
}
