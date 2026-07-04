import { getDirectChildren } from '../buildGraph';
import type { GroupFingerprints, GroupId } from './types';

export function buildGroupFingerprints(
  nodeIds: ReadonlySet<string>,
  parentByNode: ReadonlyMap<string, string | null>,
): GroupFingerprints {
  const fingerprints = new Map<GroupId, string>();
  const groupIds = new Set<GroupId>([null]);

  for (const nodeId of nodeIds) {
    const parentId = parentByNode.get(nodeId) ?? null;
    groupIds.add(parentId);
  }

  for (const groupId of groupIds) {
    const childIds = getDirectChildren(groupId, nodeIds, parentByNode);
    fingerprints.set(groupId, childIds.join(','));
  }

  return fingerprints;
}
