import type { Node } from '@xyflow/react';

/**
 * Orders nodes parent-before-child for React Flow nested nodes
 * (depth = layouted ancestors.length; node.id is the path).
 */
export function sortNodesByDepth(nodes: readonly Node[], depthById: ReadonlyMap<string, number>): Node[] {
  return [...nodes].sort((a, b) => (depthById.get(a.id) ?? 0) - (depthById.get(b.id) ?? 0));
}
