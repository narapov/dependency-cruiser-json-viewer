import type { VisibleTreeLayoutedNode } from '../../../types';
import type { LayoutCache } from '../../layoutCache/types';
import { reflowDragPushDown } from '../reflowDragPushDown';
import type { PositionUpdate } from '../types';
import { updateCacheFromPositions } from '../updateCacheFromPositions';

export interface ApplyPositionsOptions {
  commitToCache: boolean;
  cache?: LayoutCache;
}

/**
 * Applies position updates with sibling settle and ancestor resize.
 * Optionally commits affected group entries into the layout cache.
 */
export function applyPositions(
  nodesByPath: Map<string, VisibleTreeLayoutedNode>,
  parentByNode: ReadonlyMap<string, string | null>,
  positions: ReadonlyMap<string, PositionUpdate>,
  options: ApplyPositionsOptions,
): Map<string, VisibleTreeLayoutedNode> {
  if (positions.size === 0) {
    return nodesByPath;
  }

  let nextByPath = new Map(
    [...nodesByPath.entries()].map(([path, node]) => [
      path,
      {
        ...node,
        position: { ...node.position },
      },
    ]),
  );

  positions.forEach(update => {
    const node = nextByPath.get(update.path);
    if (node) {
      nextByPath.set(update.path, { ...node, position: { ...update.position } });
    }
  });

  const primaryPath = positions.keys().next().value as string;
  const primaryPosition = positions.get(primaryPath)?.position;
  if (primaryPosition) {
    nextByPath = reflowDragPushDown(nextByPath, parentByNode, primaryPath, primaryPosition);
  }

  if (options.commitToCache && options.cache) {
    updateCacheFromPositions(options.cache, nextByPath, parentByNode, primaryPath);
  }

  return nextByPath;
}
