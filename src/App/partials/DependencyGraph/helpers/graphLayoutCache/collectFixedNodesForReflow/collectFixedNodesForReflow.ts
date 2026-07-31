import type { Node } from '@xyflow/react';

import { getNodeSize } from '../resolveGroupSize';
import type { GroupId, NodeSize } from '../types';

/** Marks grown or singly-expanded nodes as fixed anchors during sibling reflow. */
export function collectFixedNodesForReflow(
  nodes: readonly Node[],
  previousSizes: ReadonlyMap<string, NodeSize>,
  previousNodes: readonly Node[] | null,
  parentByNode: ReadonlyMap<string, string | null>,
): ReadonlySet<string> {
  const previousById = previousNodes ? new Map(previousNodes.map(node => [node.id, node])) : null;
  const expandedAtParent = nodes.reduce((expanded, node) => {
    const previous = previousById?.get(node.id);
    if (previous?.type !== 'folder' || node.type !== 'folderGroup') {
      return expanded;
    }

    const parentId = parentByNode.get(node.id) ?? null;
    const siblings = expanded.get(parentId) ?? [];
    siblings.push(node.id);
    expanded.set(parentId, siblings);
    return expanded;
  }, new Map<GroupId, string[]>());

  const expansionSets = [...expandedAtParent.values()].reduce(
    (sets, childIds) => {
      if (childIds.length === 1) {
        sets.fixed.add(childIds[0]);
      } else {
        childIds.reduce((multiExpandChildIds, childId) => multiExpandChildIds.add(childId), sets.multi);
      }
      return sets;
    },
    { fixed: new Set<string>(), multi: new Set<string>() },
  );

  return nodes.reduce((fixed, node) => {
    if (fixed.has(node.id) || expansionSets.multi.has(node.id)) {
      return fixed;
    }

    const previousSize = previousSizes.get(node.id);
    if (!previousSize) {
      return fixed;
    }

    const currentSize = getNodeSize(node);
    if (currentSize.width > previousSize.width || currentSize.height > previousSize.height) {
      fixed.add(node.id);
    }
    return fixed;
  }, expansionSets.fixed);
}
