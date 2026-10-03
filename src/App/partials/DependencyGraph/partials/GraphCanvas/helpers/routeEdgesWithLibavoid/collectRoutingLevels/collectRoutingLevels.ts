import type { ThinRoutingEdge, ThinRoutingNode } from '../../../types';

export interface RoutingLevel {
  /** Folder id whose direct children form this level; `null` is the virtual canvas root. */
  parentId: string | null;
  /** Leaf↔leaf edges among direct children of `parentId` (п2). */
  leafEdges: ThinRoutingEdge[];
  /** Cross-folder edges whose LCA is `parentId` (п3). */
  crossFolderEdges: ThinRoutingEdge[];
}

/** Expanded folder groups carry a `children` array; leaves omit it. */
function isLeafNode(node: ThinRoutingNode | undefined): boolean {
  return node !== undefined && !node.children;
}

/** Nearest parent from ancestors (nearest → root), or virtual root. */
function nearestParent(node: ThinRoutingNode | undefined): string | null {
  return node?.ancestors[0] ?? null;
}

/**
 * Lowest common ancestor via path ∪ ancestors (nearest → root).
 * Passing `null` for `a` keeps the result at the virtual root.
 */
export function lowestCommonAncestor(
  a: string | null,
  b: string,
  nodeByPath: ReadonlyMap<string, ThinRoutingNode>,
): string | null {
  if (!a) {
    return null;
  }

  const setA = new Set<string>([a, ...(nodeByPath.get(a)?.ancestors ?? [])]);

  if (setA.has(b)) {
    return b;
  }

  const ancestorsB = nodeByPath.get(b)?.ancestors ?? [];
  const shared = ancestorsB.find(ancestor => setA.has(ancestor));
  return shared ?? null;
}

/**
 * LCA of all endpoints in an overlap group — used as the hierarchical subgraph root for п6.
 * Preserves virtual-root `null` (must not be replaced via `??`).
 */
export function overlapGroupParentId(
  edgeIds: readonly string[],
  edgeById: ReadonlyMap<string, ThinRoutingEdge>,
  nodeByPath: ReadonlyMap<string, ThinRoutingNode>,
): string | null {
  const endpoints = edgeIds.flatMap(edgeId => {
    const edge = edgeById.get(edgeId);
    return edge ? [edge.source, edge.target] : [];
  });
  const [first, ...rest] = endpoints;
  if (!first) {
    return null;
  }

  return rest.reduce<string | null>((lca, endpoint) => lowestCommonAncestor(lca, endpoint, nodeByPath), first);
}

/**
 * Partitions thin edges into per-folder leaf (п2) and LCA cross-folder (п3) sets.
 * Each edge is assigned to exactly one level (the LCA of its endpoints).
 */
export function collectRoutingLevels(
  nodeByPath: ReadonlyMap<string, ThinRoutingNode>,
  edges: readonly ThinRoutingEdge[],
): RoutingLevel[] {
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

  ensureLevel(null);
  nodeByPath.forEach(node => {
    if (node.children) {
      ensureLevel(node.path);
    }
  });

  edges.forEach(edge => {
    if (!nodeByPath.has(edge.source) || !nodeByPath.has(edge.target)) {
      return;
    }

    const lca = lowestCommonAncestor(edge.source, edge.target, nodeByPath);
    const level = ensureLevel(lca);
    const source = nodeByPath.get(edge.source);
    const target = nodeByPath.get(edge.target);
    const bothDirectChildren = nearestParent(source) === lca && nearestParent(target) === lca;
    const bothLeaves = isLeafNode(source) && isLeafNode(target);

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
