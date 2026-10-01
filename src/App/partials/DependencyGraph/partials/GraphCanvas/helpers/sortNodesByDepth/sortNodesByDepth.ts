import type { Node } from '@xyflow/react';

import type { CruiseSnapshot } from '@/domain';

/**
 * Orders nodes parent-before-child for React Flow nested nodes
 * (depth = snapshot ancestors.length; node.id is the path).
 */
export function sortNodesByDepth(nodes: readonly Node[], cruiseSnapshot: CruiseSnapshot): Node[] {
  return [...nodes].sort(
    (a, b) =>
      (cruiseSnapshot.nodes.get(a.id)?.ancestors.length ?? 0) - (cruiseSnapshot.nodes.get(b.id)?.ancestors.length ?? 0),
  );
}
