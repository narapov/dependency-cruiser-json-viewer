# Design

## Context

See proposal.md for motivation. Today the same DFS appears as local `indexLayoutedNodes` in `buildGraph` and `getEdgesPorts`, plus `flattenThinRoutingTree` for libavoid. Domain already hosts pure helpers (`pathUtils`, `visibleTree`); a small `treeUtils` fits that layer (stdlib only, no UI).

## Goals / Non-Goals

**Goals:**

- One generic `indexTreeByKey` in domain with `getKey(node, ancestors)`.
- Replace GraphCanvas duplicates; delete `flattenThinRoutingTree` folder.
- Keep ancestors as nearest→root for future composite keys without API churn.

**Non-Goals:**

- Changing cruise `Map`-based children (`CruisePathNode.children` is a `Map`, not an array)—out of scope unless a thin adapter is trivial; this helper targets array/`children?` trees used by visible/layouted/thin routing nodes.
- Indexing only roots (existing `new Map(roots.map(...))` stays inline).
- Parent-map builders (`parentByNode`) or absolute-position helpers.

## Decisions

### 1. Signature

```typescript
indexTreeByKey<TNode extends { children?: readonly TNode[] }, TKey>(
  roots: readonly TNode[],
  getKey: (node: TNode, ancestors: readonly TNode[]) => TKey,
): Map<TKey, TNode>
```

- **Why:** Locked in explore; optional `children`; ancestors richer than parent.
- **Alternatives:** `parent`-only callback — rejected; path-only hardcode — rejected.

### 2. Placement

- **Choice:** `src/domain/helpers/treeUtils/indexTreeByKey/` (+ barrel from `domain/helpers`).
- **Why:** Pure, reusable across App/domain; matches folder-per-helper convention.
- **Alternatives:** Shared — unnecessary UI coupling; keep in GraphCanvas — wouldn't help domain later.

### 3. Call-site migration

- **Choice:** `buildGraph` / `getEdgesPorts` / libavoid flatten → `indexTreeByKey(roots, node => node.path)`; remove dedicated flatten module.
- **Why:** All current keys are `path`.
- **Alternatives:** Keep thin wrappers named `flattenThinRoutingTree` — prefer delete to avoid fake abstraction.

### 4. Ancestors construction

- **Choice:** During DFS, pass `ancestors` as `[current, ...parentAncestors]` when entering children (nearest first). Prefer immutable array per level (`[node, ...ancestors]`) for simplicity; allocation cost is fine for layout/routing sizes.
- **Why:** Matches VisibleTree/ThinRouting `ancestors` path convention (nearest→root).
- **Alternatives:** Mutate a stack and slice on each call — micro-opt, optional later.

## Risks / Trade-offs

- **[Risk] Duplicate keys silently overwrite** → Document last-write; current path keys are unique in practice.
- **[Risk] Cruise Map-children trees not covered** → Explicit non-goal; don't force array adapter without a real caller.

## Migration Plan

- Add helper + tests; switch call sites; delete obsolete flatten; `depcruise` if barrels change.
- Rollback: revert helper and restore local DFS.

## Open Questions

- None material; folder name `treeUtils` vs flat `indexTreeByKey` under helpers — either matches conventions if barrel exports the function.
