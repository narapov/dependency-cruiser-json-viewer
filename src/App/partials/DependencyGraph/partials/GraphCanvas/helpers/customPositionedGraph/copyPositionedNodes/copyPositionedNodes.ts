import type { VisibleTreeLayoutedNode } from '../../../types';

/** Shallow-copies layouted nodes into a new map for live custom positioning. */
export function copyPositionedNodes(
  nodes: ReadonlyMap<string, VisibleTreeLayoutedNode>,
): Map<string, VisibleTreeLayoutedNode> {
  return new Map(
    [...nodes.entries()].map(([path, node]) => [
      path,
      {
        ...node,
        position: { ...node.position },
      },
    ]),
  );
}
