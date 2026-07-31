import { getDirectChildren } from '../../buildGraph';
import type { GroupFingerprints, GroupId } from '../types';

/** Fingerprints each group by the sorted list of its direct child ids. */
export function buildGroupFingerprints(
  nodeIds: ReadonlySet<string>,
  parentByNode: ReadonlyMap<string, string | null>,
): GroupFingerprints {
  const groupIds = [...nodeIds].reduce(
    (acc, nodeId) => {
      acc.add(parentByNode.get(nodeId) ?? null);
      return acc;
    },
    new Set<GroupId>([null]),
  );

  return [...groupIds].reduce((fingerprints, groupId) => {
    const childIds = getDirectChildren(groupId, nodeIds, parentByNode);
    fingerprints.set(groupId, childIds.join(','));
    return fingerprints;
  }, new Map<GroupId, string>());
}
