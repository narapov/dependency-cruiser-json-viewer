import type { GroupId } from '../../layoutCache/types';

/** Minimal node shape needed to derive parent/sibling indexes. */
export interface AncestryIndexedNode {
  path: string;
  /** Nearest parent → root (FS ancestry). */
  ancestors: readonly string[];
}

export interface GraphAncestryIndex {
  parentByNode: Map<string, string | null>;
  childrenByParent: Map<GroupId, string[]>;
}

/**
 * Builds parent and children-by-parent indexes from each node's `ancestors[0]`.
 *
 * Assumes the visible tree does not skip filesystem levels, so the nearest
 * ancestor is the React Flow / layout parent (same invariant as libavoid thin nodes).
 */
export function buildAncestryIndex(nodes: ReadonlyMap<string, AncestryIndexedNode>): GraphAncestryIndex {
  const parentByNode = new Map<string, string | null>();
  const childrenByParent = new Map<GroupId, string[]>();

  nodes.forEach(node => {
    const parentId = node.ancestors[0] ?? null;
    parentByNode.set(node.path, parentId);
    const siblings = childrenByParent.get(parentId);
    if (siblings) {
      siblings.push(node.path);
    } else {
      childrenByParent.set(parentId, [node.path]);
    }
  });

  childrenByParent.forEach(siblings => {
    siblings.sort((a, b) => a.localeCompare(b));
  });

  return { parentByNode, childrenByParent };
}
