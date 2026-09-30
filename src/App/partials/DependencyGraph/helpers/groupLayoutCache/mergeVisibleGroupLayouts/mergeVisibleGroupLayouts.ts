import type { VisibleTreeLayoutedNode } from '../../../types';
import type { GroupId, GroupLayoutEntry, LayoutCache } from '../types';

/** Minimal geometry needed to build a group layout entry. */
export interface LayoutedChildGeometry {
  path: string;
  position: { x: number; y: number };
  width: number;
  height: number;
}

/** Builds a group layout entry from a parent id and its direct laid-out children. */
export function buildGroupLayoutEntry(
  groupId: GroupId,
  children: readonly LayoutedChildGeometry[],
  groupSize?: { width: number; height: number },
): GroupLayoutEntry {
  const maxBounds = children.reduce(
    (bounds, child) => ({
      width: Math.max(bounds.width, child.position.x + child.width),
      height: Math.max(bounds.height, child.position.y + child.height),
    }),
    { width: 0, height: 0 },
  );

  return {
    id: groupId,
    width: groupSize?.width ?? maxBounds.width,
    height: groupSize?.height ?? maxBounds.height,
    children: new Map(
      children.map(child => [
        child.path,
        {
          id: child.path,
          position: { ...child.position },
          width: child.width,
          height: child.height,
        },
      ]),
    ),
  };
}

/**
 * Walks a laid-out visible tree and collects group layout entries for every
 * expanded folder (children present) plus the root group.
 */
export function collectVisibleGroupLayouts(roots: readonly VisibleTreeLayoutedNode[]): LayoutCache {
  const collected: LayoutCache = new Map();

  const visitGroup = (
    groupId: GroupId,
    children: readonly VisibleTreeLayoutedNode[],
    groupNode?: VisibleTreeLayoutedNode,
  ) => {
    collected.set(
      groupId,
      buildGroupLayoutEntry(
        groupId,
        children,
        groupNode ? { width: groupNode.width, height: groupNode.height } : undefined,
      ),
    );

    children.forEach(child => {
      if (child.children) {
        visitGroup(child.path, child.children, child);
      }
    });
  };

  visitGroup(null, roots);
  return collected;
}

/**
 * Overwrites cache entries for groups present in `visibleLayouts` and leaves
 * all other (hidden / collapsed) entries untouched.
 */
export function mergeVisibleGroupLayouts(cache: LayoutCache, visibleLayouts: LayoutCache): void {
  visibleLayouts.forEach((entry, groupId) => {
    cache.set(groupId, {
      id: entry.id,
      width: entry.width,
      height: entry.height,
      children: new Map(
        [...entry.children.entries()].map(([childId, child]) => [
          childId,
          {
            id: child.id,
            position: { ...child.position },
            width: child.width,
            height: child.height,
          },
        ]),
      ),
    });
  });
}
