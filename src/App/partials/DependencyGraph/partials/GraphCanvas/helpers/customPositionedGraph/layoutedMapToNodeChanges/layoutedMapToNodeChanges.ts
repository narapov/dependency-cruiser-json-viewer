import type { Node, NodeChange } from '@xyflow/react';

import type { VisibleTreeLayoutedNode } from '../../../types';

/**
 * Builds React Flow node changes for position and size deltas from a layouted map.
 */
export function layoutedMapToNodeChanges(
  reflowed: ReadonlyMap<string, VisibleTreeLayoutedNode>,
  currentNodes: readonly Node[],
): NodeChange[] {
  return currentNodes.flatMap(node => {
    const layouted = reflowed.get(node.id);
    if (!layouted) {
      return [];
    }

    const changes: NodeChange[] = [];
    if (layouted.position.x !== node.position.x || layouted.position.y !== node.position.y) {
      changes.push({
        type: 'position',
        id: node.id,
        position: { ...layouted.position },
      });
    }

    const currentWidth = node.width ?? (typeof node.style?.width === 'number' ? node.style.width : undefined);
    const currentHeight = node.height ?? (typeof node.style?.height === 'number' ? node.style.height : undefined);
    if (layouted.width !== currentWidth || layouted.height !== currentHeight) {
      changes.push({
        type: 'dimensions',
        id: node.id,
        dimensions: { width: layouted.width, height: layouted.height },
        setAttributes: true,
      });
    }

    return changes;
  });
}
