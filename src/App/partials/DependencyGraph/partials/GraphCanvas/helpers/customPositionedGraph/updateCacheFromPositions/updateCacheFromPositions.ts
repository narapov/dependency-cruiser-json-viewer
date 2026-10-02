import type { VisibleTreeLayoutedNode } from '../../../types';
import { getDirectChildren } from '../../buildGraph/getDirectChildren';
import { GROUP_HEADER, GROUP_PADDING } from '../../buildGraph/layoutConstants';
import { buildGroupLayoutEntry } from '../../layoutCache/mergeVisibleGroupLayouts';
import type { GroupId, LayoutCache } from '../../layoutCache/types';

/** Writes group layout entries for a node and all of its ancestor groups from positioned nodes. */
export function updateCacheFromPositions(
  cache: LayoutCache,
  nodesByPath: ReadonlyMap<string, VisibleTreeLayoutedNode>,
  parentByNode: ReadonlyMap<string, string | null>,
  startNodeId: string,
): void {
  const nodeIds = new Set(nodesByPath.keys());

  let groupId: GroupId = parentByNode.get(startNodeId) ?? null;
  for (;;) {
    const childIds = getDirectChildren(groupId, nodeIds, parentByNode);
    const children = childIds
      .map(id => nodesByPath.get(id))
      .filter((node): node is VisibleTreeLayoutedNode => node != null)
      .map(node => ({
        path: node.path,
        position: { ...node.position },
        width: node.width,
        height: node.height,
      }));

    const groupNode = groupId ? nodesByPath.get(groupId) : undefined;
    const groupSize = groupNode
      ? { width: groupNode.width, height: groupNode.height }
      : {
          width: Math.max(...children.map(c => c.position.x + c.width), GROUP_PADDING) + GROUP_PADDING,
          height: Math.max(...children.map(c => c.position.y + c.height), GROUP_HEADER + GROUP_PADDING) + GROUP_PADDING,
        };

    cache.set(groupId, buildGroupLayoutEntry(groupId, children, groupSize));

    if (groupId === null) {
      break;
    }
    groupId = parentByNode.get(groupId) ?? null;
  }
}
