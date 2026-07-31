import type { Node } from '@xyflow/react';

import { getDirectChildren } from '../../buildGraph';
import { nodesOverlap } from '../nodesOverlap';
import { getNodeSize } from '../resolveGroupSize';
import type { GroupFingerprints, GroupId, NodeSize } from '../types';

function groupHasOverlappingSiblings(
  groupId: GroupId,
  nodeById: Map<string, Node>,
  parentByNode: ReadonlyMap<string, string | null>,
): boolean {
  const nodeIds = new Set(nodeById.keys());
  const childIds = getDirectChildren(groupId, nodeIds, parentByNode);
  if (childIds.length <= 1) {
    return false;
  }

  const siblings = childIds.map(id => nodeById.get(id)!);

  return siblings.some((sibling, i) => {
    const aSize = getNodeSize(sibling);
    return siblings.some(
      (other, j) => j > i && nodesOverlap(sibling.position, aSize, other.position, getNodeSize(other)),
    );
  });
}

/** Collects groups whose children need sibling reflow after size or membership changes. */
export function collectGroupsNeedingReflow(
  nodes: Node[],
  parentByNode: ReadonlyMap<string, string | null>,
  previousSizes: ReadonlyMap<string, NodeSize>,
  currentFingerprints: GroupFingerprints | null,
  previousFingerprints: GroupFingerprints | null,
): Set<GroupId> {
  const nodeById = new Map(nodes.map(node => [node.id, node]));

  const groups = nodes.reduce((changedGroups, node) => {
    const currentSize = getNodeSize(node);
    const previousSize = previousSizes.get(node.id);
    if (previousSize && (previousSize.width !== currentSize.width || previousSize.height !== currentSize.height)) {
      changedGroups.add(node.parentId ?? null);
    }
    return changedGroups;
  }, new Set<GroupId>());

  if (previousFingerprints !== null && currentFingerprints !== null) {
    [...currentFingerprints].reduce((changedGroups, [groupId, fingerprint]) => {
      const previous = previousFingerprints.get(groupId);
      if (previous !== fingerprint) {
        changedGroups.add(groupId);
      }
      return changedGroups;
    }, groups);
  }

  if (currentFingerprints !== null) {
    [...currentFingerprints.keys()].reduce((changedGroups, groupId) => {
      if (groupHasOverlappingSiblings(groupId, nodeById, parentByNode)) {
        changedGroups.add(groupId);
      }
      return changedGroups;
    }, groups);
  }

  return groups;
}
