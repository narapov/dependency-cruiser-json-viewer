import type { Edge, Node } from '@xyflow/react';

export interface RoutingLevel {
  /** Folder id whose direct children form this level; `null` is the virtual canvas root. */
  parentId: string | null;
  /** Leaf↔leaf edges among direct children of `parentId` (п2). */
  leafEdges: Edge[];
  /** Cross-folder edges whose LCA is `parentId` (п3). */
  crossFolderEdges: Edge[];
}

function isLeafNode(node: Node | undefined): boolean {
  return node !== undefined && node.type !== 'folderGroup';
}

/**
 * Lowest common ancestor in the RF parent map (`null` = virtual root).
 * Passing `null` for `a` keeps the result at the virtual root.
 */
export function lowestCommonAncestor(
  a: string | null,
  b: string,
  parentByNode: ReadonlyMap<string, string | null>,
): string | null {
  const ancestors = new Set<string>();
  let cursor: string | null | undefined = a;
  while (cursor) {
    ancestors.add(cursor);
    cursor = parentByNode.has(cursor) ? (parentByNode.get(cursor) ?? null) : null;
  }

  cursor = b;
  while (cursor) {
    if (ancestors.has(cursor)) {
      return cursor;
    }
    cursor = parentByNode.has(cursor) ? (parentByNode.get(cursor) ?? null) : null;
  }

  return null;
}

/**
 * LCA of all endpoints in an overlap group — used as the hierarchical subgraph root for п6.
 * Preserves virtual-root `null` (must not be replaced via `??`).
 */
export function overlapGroupParentId(
  edgeIds: readonly string[],
  edgeById: ReadonlyMap<string, Edge>,
  parentByNode: ReadonlyMap<string, string | null>,
): string | null {
  const endpoints = edgeIds.flatMap(edgeId => {
    const edge = edgeById.get(edgeId);
    return edge ? [edge.source, edge.target] : [];
  });
  const [first, ...rest] = endpoints;
  if (!first) {
    return null;
  }

  return rest.reduce<string | null>((lca, endpoint) => lowestCommonAncestor(lca, endpoint, parentByNode), first);
}

/**
 * Partitions visible RF edges into per-folder leaf (п2) and LCA cross-folder (п3) sets.
 * Each edge is assigned to exactly one level (the LCA of its endpoints).
 */
export function collectRoutingLevels(
  nodes: readonly Node[],
  edges: readonly Edge[],
  parentByNode: ReadonlyMap<string, string | null>,
): RoutingLevel[] {
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const nodeIds = new Set(nodeById.keys());

  const levelByParent = new Map<string | null, RoutingLevel>();

  const ensureLevel = (parentId: string | null): RoutingLevel => {
    const existing = levelByParent.get(parentId);
    if (existing) {
      return existing;
    }
    const created: RoutingLevel = { parentId, leafEdges: [], crossFolderEdges: [] };
    levelByParent.set(parentId, created);
    return created;
  };

  // Ensure every expanded folder (and root) appears even with zero edges — useful for iteration order.
  ensureLevel(null);
  nodes.forEach(node => {
    if (node.type === 'folderGroup') {
      ensureLevel(node.id);
    }
  });

  edges.forEach(edge => {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      return;
    }

    const lca = lowestCommonAncestor(edge.source, edge.target, parentByNode);
    const level = ensureLevel(lca);
    const sourceParent = parentByNode.get(edge.source) ?? null;
    const targetParent = parentByNode.get(edge.target) ?? null;
    const bothDirectChildren = sourceParent === lca && targetParent === lca;
    const bothLeaves = isLeafNode(nodeById.get(edge.source)) && isLeafNode(nodeById.get(edge.target));

    if (bothDirectChildren && bothLeaves) {
      level.leafEdges.push(edge);
    } else {
      level.crossFolderEdges.push(edge);
    }
  });

  return [...levelByParent.values()].toSorted((a, b) => {
    if (a.parentId === null) {
      return 1;
    }
    if (b.parentId === null) {
      return -1;
    }
    return a.parentId.localeCompare(b.parentId);
  });
}
