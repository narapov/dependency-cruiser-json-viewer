import type { Edge, Node } from '@xyflow/react';

/** One folder (or root) level of sibling obstacles and edges for libavoid. */
export interface SiblingRoutingLevel {
  folderId: string | null;
  /** Direct children of `folderId`, including expanded `folderGroup` nodes. */
  nodes: Node[];
  /** RF edges whose source and target are both in `nodes`. */
  edges: Edge[];
}

/**
 * Walks the folder hierarchy bottom-up and collects per-level sibling edge sets.
 * Cross-parent edges are omitted (they never appear in any level).
 * Levels with no sibling edges are skipped.
 */
export function collectSiblingRoutingLevels(
  nodes: readonly Node[],
  edges: readonly Edge[],
  parentByNode: ReadonlyMap<string, string | null>,
): SiblingRoutingLevel[] {
  const levels: SiblingRoutingLevel[] = [];

  const visit = (folderId: string | null) => {
    const children = nodes
      .filter(node => (parentByNode.get(node.id) ?? null) === folderId)
      .toSorted((a, b) => a.id.localeCompare(b.id));

    children.filter(node => node.type === 'folderGroup').forEach(group => visit(group.id));

    const childIds = new Set(children.map(child => child.id));
    const siblingEdges = edges.filter(edge => childIds.has(edge.source) && childIds.has(edge.target));

    if (siblingEdges.length === 0) {
      return;
    }

    levels.push({
      folderId,
      nodes: children,
      edges: siblingEdges,
    });
  };

  visit(null);
  return levels;
}
