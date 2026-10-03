import type { VisibleTreeLayoutedNode } from '../../../types';
import type { LayoutCache } from '../../layoutCache/types';
import { copyPositionedNodes } from '../copyPositionedNodes';

/**
 * Overlays group-cache geometry onto a copy of layouted nodes (positions + sizes).
 */
export function applyCacheGeometryToNodes(
  nodes: ReadonlyMap<string, VisibleTreeLayoutedNode>,
  cache: LayoutCache,
  parentByNode: ReadonlyMap<string, string | null>,
): Map<string, VisibleTreeLayoutedNode> {
  if (cache.size === 0) {
    return copyPositionedNodes(nodes);
  }

  const next = copyPositionedNodes(nodes);

  next.forEach((node, path) => {
    const parentId = parentByNode.get(path) ?? null;
    const child = cache.get(parentId)?.children.get(path);
    if (!child) {
      return;
    }
    next.set(path, {
      ...node,
      position: { ...child.position },
      width: child.width,
      height: child.height,
    });
  });

  cache.forEach((entry, groupId) => {
    if (groupId === null) {
      return;
    }
    const groupNode = next.get(groupId);
    if (!groupNode?.children) {
      return;
    }
    next.set(groupId, {
      ...groupNode,
      width: entry.width,
      height: entry.height,
    });
  });

  return next;
}
